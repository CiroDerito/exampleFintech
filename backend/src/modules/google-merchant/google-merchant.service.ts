import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../users/entities/user.entity';
import { GcsService } from 'src/gcs/gcs.service';
import { emailToTenant } from 'src/gcs/tenant.util';
import { buildSnapshotPath } from 'src/gcs/path';
import { GoogleMerchant } from './entities/google-merchant.entity';
import { throwNestHttpFromAxios } from 'src/utils/axios.helper';

type TokenSet = {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
  scope?: string;
  id_token?: string;
  token_type?: string;
};

@Injectable()
export class GoogleMerchantService {
  constructor(
    @InjectRepository(GoogleMerchant) private readonly merchantRepo: Repository<GoogleMerchant>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly gcs: GcsService,
  ) { }

  private oauth = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.MERCHANT_REDIRECT_URI,
  );

  async saveMerchantData(userId: string, data?: any, metrics?: any) {
    const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['googleMerchant'] });
    if (!user) throw new NotFoundException('Usuario no encontrado'); 

    let merchant = user.googleMerchant;
    if (!merchant) {
      merchant = this.merchantRepo.create({ user });
      user.googleMerchant = merchant;
    }

    if (data) merchant.data = { ...(merchant.data ?? {}), ...data };
    if (metrics) merchant.metrics = metrics;

    await this.merchantRepo.save(merchant);
    await this.userRepo.save(user);
    return merchant;
  }

  getAuthUrl(state: string) {
    const defaultScopes = [
      'https://www.googleapis.com/auth/content',
      'https://www.googleapis.com/auth/content.readonly',
      'https://www.googleapis.com/auth/shopping.reports',
      'https://www.googleapis.com/auth/merchantapi',
    ];
    const envScopes = process.env.MERCHANT_SCOPES;
    const scopes = envScopes ? envScopes.split(',') : defaultScopes;

    return this.oauth.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
      state,
      redirect_uri: process.env.MERCHANT_REDIRECT_URI,
    });
  }

  async exchangeCode(userId: string, code: string) {
    const { tokens } = await this.oauth.getToken(code);

    const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['googleMerchant'] });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    let merchant = user.googleMerchant;
    if (!merchant) {
      merchant = this.merchantRepo.create({ user });
      user.googleMerchant = merchant;
    }

    merchant.tokens = tokens as TokenSet;
    await this.merchantRepo.save(merchant);
    await this.userRepo.save(user);

    try {
      const tenant = emailToTenant(user?.email, userId);
      await this.gcs.ensureTenantPrefix(tenant, 'merchant');
      const tokensPath = buildSnapshotPath(tenant, 'merchant', 'tokens', 'json');
      await this.gcs.uploadJson(tokensPath, {
        userId,
        connected_at: new Date().toISOString(),
        scopes: tokens.scope,
      });
    } catch {
      throw new BadRequestException('Error al subir tokens a GCS');
    }

    return merchant;
  }

  private async getRequestHeadersFor(userId: string) {
    const entry = await this.merchantRepo.findOne({ where: { user: { id: userId } } });
    if (!entry?.tokens) throw new Error('Google Merchant no vinculado');

    let tokens = entry.tokens;

    if (tokens.expiry_date && Date.now() >= tokens.expiry_date) {
      if (!tokens.refresh_token) throw new Error('Token expirado y sin refresh_token');
      this.oauth.setCredentials(tokens);
      const { credentials } = await this.oauth.refreshAccessToken();
      tokens = { ...tokens, ...credentials } as TokenSet;
      entry.tokens = tokens;
      await this.merchantRepo.save(entry);
    }

    return {
      Authorization: `Bearer ${tokens.access_token}`,
      'Content-Type': 'application/json',
    };
  }

  async listMerchantAccounts(userId: string) {
    try {
      const headers = await this.getRequestHeadersFor(userId);
      const url = 'https://merchantapi.googleapis.com/accounts/v1beta/accounts';
      const { data } = await axios.get(url, { headers });
      let accounts: any[] = [];

      if (data?.accounts) accounts = data.accounts;
      else if (data?.resources) accounts = data.resources;
      else if (Array.isArray(data)) accounts = data;

      const formatted = accounts
        .map((acc: any) => {
          let accountId = acc.accountId || acc.id;
          if (typeof accountId === 'string' && accountId.includes('/')) {
            accountId = accountId.split('/').pop();
          }
          let accountName = acc.displayName || acc.accountName || acc.businessName;
          if (!accountName && acc.businessInformation) {
            accountName =
              acc.businessInformation.customerService?.phone ||
              acc.businessInformation.address?.streetAddress ||
              `Cuenta ${accountId}`;
          }
          if (!accountName) accountName = `Cuenta de Merchant ${accountId}`;

          return {
            id: accountId,
            name: accountName,
            websiteUrl: acc.websiteUrl || acc.website || acc.businessInformation?.website,
            adultContent: acc.adultContent,
            verified: acc.verified !== false,
            country: acc.country || acc.businessInformation?.address?.country,
            accountType: acc.accountType || 'MERCHANT',
          };
        })
        .filter((acc) => acc.id);

      return formatted;
    } catch (error: any) {
      if (error.response?.status === 404) return [];
      throw error;
    }
  }

  async linkMerchantAccount(userId: string, merchantId: string) {
    if (!merchantId) throw new BadRequestException('MerchantId es requerido');

    const entry = await this.merchantRepo.findOne({ where: { user: { id: userId } } });
    if (!entry) throw new BadRequestException('Google Merchant no vinculado');

    const linkedAt = new Date().toISOString();
    entry.data = { ...(entry.data ?? {}), merchantId, linked_at: linkedAt, accountInfo: { merchantId, linkedAt } };
    const saved = await this.merchantRepo.save(entry);

    try {
      const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['googleMerchant'] });
      const tenant = emailToTenant(user?.email, userId);
      await this.gcs.ensureTenantPrefix(tenant, 'merchant');
      const accountPath = buildSnapshotPath(tenant, 'merchant', 'account', 'json');
      await this.gcs.uploadJson(accountPath, { userId, merchantId, linked_at: linkedAt });
    } catch {
      throw new BadRequestException('Error al subir metadata de cuenta a GCS');
    }

    try {
      const metrics = await this.fetchMetrics(userId, { merchantId });
      return { ...saved, metrics };
    } catch {
      return saved;
    }
  }

  async fetchMetrics(
    userId: string,
    params: { merchantId?: string; startDate?: string; endDate?: string },
  ) {
    const entry = await this.merchantRepo.findOne({ where: { user: { id: userId } }, relations: ['user'] });
    if (!entry) throw new BadRequestException('Google Merchant no vinculado');

    const merchantId = params.merchantId || entry.data?.merchantId;
    if (!merchantId) throw new BadRequestException('Falta merchantId');

    try {
      const headers = await this.getRequestHeadersFor(userId);

      const today = new Date();
      const oneYearAgo = new Date(today);
      oneYearAgo.setFullYear(today.getFullYear() - 1);

      let optimalStartDate = oneYearAgo;

      if (entry.data?.linked_at) {
        const linkedDate = new Date(entry.data.linked_at);
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);

        if (linkedDate < oneYearAgo) optimalStartDate = oneYearAgo;
        else if (linkedDate > thirtyDaysAgo) optimalStartDate = thirtyDaysAgo;
        else optimalStartDate = linkedDate;
      }

      const end = params.endDate ?? today.toISOString().slice(0, 10);
      const start = params.startDate ?? optimalStartDate.toISOString().slice(0, 10);

      const products = await this.fetchProducts(merchantId, headers);
      const orders = await this.fetchOrders(merchantId, headers);
      const inventory = await this.fetchInventory(merchantId, headers);
      const productStatuses = await this.fetchProductStatuses(merchantId, headers);

      const { performanceReports, dailyReports } = await this.fetchPerformanceReports(merchantId, headers, start, end);

      const metricsStructure = {
        fetched_at: new Date().toISOString(),
        userId,
        merchantId,
        startDate: start,
        endDate: end,
        tenant: emailToTenant(entry.user?.email, userId),
        metrics: {
          products: {
            products: products.slice(0, 1000),
            productstatuses: productStatuses.slice(0, 1000),
          },
          reports: {
            totals: {
              clicks: performanceReports.clicks,
              impressions: performanceReports.impressions,
              conversions: performanceReports.conversions,
              conversionValue: performanceReports.conversionValue,
            },
            daily: dailyReports.map(d => ({
              date: d.date,
              clicks: d.clicks,
              impressions: d.impressions,
              conversions: d.conversions,
              conversionValue: d.conversionValue,
            })),
            metadata: {
              totalDays: dailyReports.length,
              dateRange: { start, end },
              lastUpdate: new Date().toISOString(),
              hasPerformanceData: dailyReports.length > 0,
              apiUsed: dailyReports.length > 0 ? 'Merchant Reports API' : 'Content API fallback',
              note: 'Google Merchant Center data with performance metrics',
            },
          },
        },
        summary: {
          totalProducts: products.length,
          totalProductStatuses: productStatuses.length,
          totalOrders: orders.length,
          totalInventoryItems: inventory.length,
          totalClicks: performanceReports.clicks,
          totalImpressions: performanceReports.impressions,
          totalConversions: performanceReports.conversions,
          totalConversionValue: performanceReports.conversionValue,
          performanceDays: dailyReports.length,
        },
        dataQuality: {
          hasProducts: products.length > 0,
          hasProductStatuses: productStatuses.length > 0,
          hasOrders: orders.length > 0,
          hasInventory: inventory.length > 0,
          hasPerformanceData: dailyReports.length > 0,
          dataCompleteness: {
            products: `${products.length} items`,
            productStatuses: `${productStatuses.length} items`,
            orders: `${orders.length} items`,
            inventory: `${inventory.length} items`,
            performanceReports: `${dailyReports.length} days`,
          }
        }
      }; 

      entry.metrics = metricsStructure;
      entry.data = {
        ...(entry.data ?? {}),
        lastFetched: new Date().toISOString(),
        dataQuality: {
          hasProducts: products.length > 0,
          hasProductStatuses: productStatuses.length > 0,
          hasOrders: false,
          hasInventory: false,
          hasReports: false
        },
        // Información adicional de completeness
        productCount: products.length,
        productStatusCount: productStatuses.length,
        performanceDaysCount: dailyReports.length,
      };
      const savedEntry = await this.merchantRepo.save(entry);

      // Subir snapshot a GCS con manejo de errores mejorado
      const tenant = emailToTenant(entry.user?.email, userId);
      await this.gcs.ensureTenantPrefix(tenant, 'merchant');
      
      const snapshotPath = buildSnapshotPath(tenant, 'merchant', 'snapshot', 'json');
      
      try {
        await this.gcs.uploadJson(snapshotPath, metricsStructure);
      } catch (gcsError: any) {
        // No hacer throw aquí, las métricas ya se guardaron en BD
      }

      return metricsStructure;
    } catch (error: any) {
      const merchantId = params.merchantId || entry.data?.merchantId;
      const isCriticalError =
        error?.response?.status === 401 ||
        error?.response?.status === 403 ||
        error?.message?.includes('Google Merchant no vinculado') ||
        error?.message?.includes('Falta merchantId');

      if (isCriticalError) {
        const errorSnapshot = {
          error: error.message,
          timestamp: new Date().toISOString(),
          fetched_at: new Date().toISOString(),
          merchantId,
          userId,
          startDate: params.startDate || new Date().toISOString().slice(0, 10),
          endDate: params.endDate || new Date().toISOString().slice(0, 10),
          metrics: {
            products: {
               products: [], 
               productstatuses: [] 
              },
            reports: {
              totals: { clicks: 0, impressions: 0 },
              daily: [],
              metadata: {
                totalDays: 0,
                dateRange: { start: params.startDate, end: params.endDate },
                lastUpdate: new Date().toISOString(),
                hasPerformanceData: false,
                apiUsed: 'none',
              },
            },
          },
          summary: {
            totalProducts: 0,
            totalProductStatuses: 0,
            totalClicks: 0,
            totalImpressions: 0,
          },
        };


        entry.metrics = errorSnapshot as any;
        await this.merchantRepo.save(entry);

        // Subir snapshot de error a GCS
        try {
          const tenant = emailToTenant(entry.user?.email, userId);
          await this.gcs.ensureTenantPrefix(tenant, 'merchant');
          
          const errorSnapshotPath = buildSnapshotPath(tenant, 'merchant', 'error-snapshot', 'json');
          await this.gcs.uploadJson(errorSnapshotPath, errorSnapshot);
        } catch (gcsError: any) {
          // Silently fail
        }
      }

      throw error;
    }
  }

  async getMerchantStatus(userId: string) {
    const entry = await this.merchantRepo.findOne({ where: { user: { id: userId } }, relations: ['user'] });
    if (!entry) {
      return { connected: false, hasAccount: false, hasData: false, hasMetrics: false };
    }

    const hasAccount = !!entry.data?.merchantId;
    const hasData = !!entry.data && Object.keys(entry.data).length > 1;
    const hasMetrics = !!entry.metrics;

    return {
      connected: true,
      hasAccount,
      hasData,
      hasMetrics,
      merchantId: entry.data?.merchantId,
      lastFetched: entry.data?.lastFetched,
      dataQuality: entry.data?.dataQuality,
      metricsSummary: (entry.metrics as any)?.summary,
      accountInfo: {
        userId,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      },
    };
  }

  async fetchAndSaveMetrics(userId: string, merchantId?: string): Promise<any> {
    return this.fetchMetrics(userId, { merchantId });
  }

  async deleteUserData(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['googleMerchant'] });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (!user.googleMerchant) return { success: true };

    await this.merchantRepo.delete(user.googleMerchant.id);
    user.googleMerchant = null!;
    await this.userRepo.save(user);
    return { success: true };
  }

  // ===============================
  // PRIVADOS
  // ===============================

  private async fetchProducts(merchantId: string, headers: any): Promise<any[]> {
    let allProducts: any[] = [];
    try {
      let nextPageToken = '';
      let pageCount = 0;
      const maxPages = 10;

      do {
        const productsUrl = `https://merchantapi.googleapis.com/inventories/v1beta/accounts/${merchantId}/products`;
        const params = new URLSearchParams();
        params.append('pageSize', '250');
        if (nextPageToken) params.append('pageToken', nextPageToken);

        const { data } = await axios.get(`${productsUrl}?${params.toString()}`, { headers });
        const pageProducts = data?.products ?? [];
        allProducts.push(...pageProducts);
        nextPageToken = data?.nextPageToken || '';
        pageCount++;
      } while (nextPageToken && pageCount < maxPages);

      return allProducts;
    } catch {
      try {
        let startIndex = 0;
        const maxResults = 250;
        let hasMore = true;
        let pageCount = 0;
        const maxPages = 10;

        while (hasMore && pageCount < maxPages) {
          const legacyUrl = `https://www.googleapis.com/content/v2.1/${merchantId}/products`;
          const params = new URLSearchParams();
          params.append('maxResults', maxResults.toString());
          if (startIndex > 0) params.append('startIndex', startIndex.toString());

          const { data } = await axios.get(`${legacyUrl}?${params.toString()}`, { headers });
          const pageProducts = data?.resources ?? [];
          allProducts.push(...pageProducts);

          hasMore = pageProducts.length === maxResults;
          startIndex += maxResults;
          pageCount++;
        }

        return allProducts;
      } catch {
        return [];
      }
    }
  }

  private async fetchOrders(merchantId: string, headers: any): Promise<any[]> {
    try {
      let allOrders: any[] = [];
      let nextPageToken = '';
      let pageCount = 0;
      const maxPages = 50;

      do {
        const ordersUrl = `https://www.googleapis.com/content/v2.1/${merchantId}/orders`;
        const params: any = { maxResults: 250 };
        if (nextPageToken) params.pageToken = nextPageToken;

        const { data } = await axios.get(ordersUrl, { headers, params });
        const pageOrders = data?.resources ?? [];
        allOrders = allOrders.concat(pageOrders);

        nextPageToken = data?.nextPageToken || '';
        pageCount++;
      } while (nextPageToken && pageCount < maxPages);

      return allOrders;
    } catch {
      return [];
    }
  }

  private async fetchInventory(merchantId: string, headers: any): Promise<any[]> {
    try {
      let allInventory: any[] = [];
      let nextPageToken = '';
      let pageCount = 0;
      const maxPages = 50;

      do {
        const inventoryUrl = `https://www.googleapis.com/content/v2.1/${merchantId}/localinventory`;
        const params: any = { maxResults: 250 };
        if (nextPageToken) params.pageToken = nextPageToken;

        const { data } = await axios.get(inventoryUrl, { headers, params });
        const pageInventory = data?.resources ?? [];
        allInventory = allInventory.concat(pageInventory);

        nextPageToken = data?.nextPageToken || '';
        pageCount++;
      } while (nextPageToken && pageCount < maxPages);

      return allInventory;
    } catch {
      return [];
    }
  }

  private async fetchProductStatuses(merchantId: string, headers: any): Promise<any[]> {
    try {
      let allProductStatuses: any[] = [];
      let nextPageToken = '';
      let pageCount = 0;
      const maxPages = 100;

      do {
        const statusesUrl = `https://www.googleapis.com/content/v2.1/${merchantId}/productstatuses`;
        const params: any = { maxResults: 250 };
        if (nextPageToken) params.pageToken = nextPageToken;

        const { data } = await axios.get(statusesUrl, { headers, params });
        const pageStatuses = data?.resources ?? [];
        allProductStatuses = allProductStatuses.concat(pageStatuses);

        nextPageToken = data?.nextPageToken || '';
        pageCount++;
      } while (nextPageToken && pageCount < maxPages);

      return allProductStatuses;
    } catch {
      return [];
    }
  }

  private async fetchPerformanceReports(
    merchantId: string,
    headers: any,
    start: string,
    end: string
  ) {
    type DailyRow = {
      date: string;
      clicks: number;
      impressions: number;
      conversions: number;      // FREE only
      conversionValue: number;  // FREE only (micros -> unidades)
    };

    const totals = { clicks: 0, impressions: 0, conversions: 0, conversionValue: 0 };
    const daily: DailyRow[] = [];

    // Para que 'conversions' y 'conversion_value_micros' no vengan 0,
    // limitamos a tráfico FREE (son los únicos que lo exponen en Merchant).
    const wherePrograms = `AND segments.program IN ('FREE_PRODUCT_LISTING','FREE_LOCAL_PRODUCT_LISTING')`;

    const v1betaUrl = `https://merchantapi.googleapis.com/reports/v1beta/accounts/${merchantId}/reports:search`;
    const v1betaBody = {
      query: `
      SELECT
        segments.date,
        metrics.clicks,
        metrics.impressions,
        metrics.conversions,
        metrics.conversion_value_micros
      FROM MerchantPerformanceView
      WHERE segments.date >= '${start}' AND segments.date <= '${end}' ${wherePrograms}
      ORDER BY segments.date
    `,
      pageSize: 1000,
    };

    const v21Url = `https://www.googleapis.com/content/v2.1/${merchantId}/reports/search`;
    const v21Body = v1betaBody;

    const runPaged = async (url: string, body: any) => {
      let pageToken: string | undefined;
      do {
        const { data } = await axios.post(url, pageToken ? { ...body, pageToken } : body, { headers });
        const results = data?.results ?? [];
        for (const r of results) {
          const seg = r.segments || {};
          const met = r.metrics || {};

          const clicks = Number(met.clicks?.value ?? met.clicks ?? 0);
          const impressions = Number(met.impressions?.value ?? met.impressions ?? 0);
          const conversions = Number(met.conversions?.value ?? met.conversions ?? 0);

          let conversionValue = 0;
          const micros =
            met.conversion_value_micros?.value ??
            met.conversion_value_micros ??
            met.conversion_value?.micros ??
            undefined;
          if (micros != null) conversionValue = Number(micros) / 1_000_000;

          daily.push({
            date: seg.date || r.date,
            clicks,
            impressions,
            conversions,
            conversionValue,
          });

          totals.clicks += clicks;
          totals.impressions += impressions;
          totals.conversions += conversions;
          totals.conversionValue += conversionValue;
        }
        pageToken = data?.nextPageToken;
      } while (pageToken);
    };

    try {
      await runPaged(v1betaUrl, v1betaBody);
      if (daily.length === 0) await runPaged(v21Url, v21Body);
    } catch (e) {
      try {
        if (daily.length === 0) await runPaged(v21Url, v21Body);
      } catch (e2) {
        throwNestHttpFromAxios(e2, 'Error consultando reports de Merchant');
      }
    }

    // cost y averageCPC no existen en Merchant; dejamos 0
    const performanceReports = {
      clicks: totals.clicks,
      impressions: totals.impressions,
      conversions: totals.conversions,
      conversionValue: totals.conversionValue,
      cost: 0,
      averageCPC: 0,
    };

    return { performanceReports, dailyReports: daily };
  } 
}
