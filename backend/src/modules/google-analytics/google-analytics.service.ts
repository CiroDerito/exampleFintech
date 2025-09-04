import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { OAuth2Client } from 'google-auth-library';
import { User } from '../users/entities/user.entity';
import { GcsService } from 'src/gcs/gcs.service';
import { emailToTenant } from 'src/gcs/tenant.util';
import { buildObjectPath } from 'src/gcs/path';
import { GaAnalytics } from './entities/google-analytics.entity';

type TokenSet = {
  access_token: string;
  refresh_token?: string;
  expiry_date?: number;
  scope?: string;
  id_token?: string;
  token_type?: string;
};

@Injectable()
export class GaAnalyticsService {
  constructor(
    @InjectRepository(GaAnalytics) private readonly gaRepo: Repository<GaAnalytics>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly gcs: GcsService,
  ) { }

  private oauth = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GA_REDIRECT_URI, // mantengo misma env que ya usabas
  );

  /** Upsert: guarda tokens/propiedad/metadata */
  async saveGaData(userId: string, data?: any, metrics?: any) {
    const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['gaAnalytics'] });
    if (!user) throw new Error('User not found');

    let ga = await this.gaRepo.findOne({ where: { user: { id: userId } } });
    if (!ga) {
      ga = this.gaRepo.create({ user, data, metrics });
    } else {
      if (typeof data !== 'undefined') ga.data = data;
      if (typeof metrics !== 'undefined') ga.metrics = metrics;
    }
    ga = await this.gaRepo.save(ga);

    // reflejo en user si querés consistencia
    (user as any)['gaAnalytics'] = ga;
    await this.userRepo.save(user);
    return ga;
  }

  /** Genera URL de autorización */
  getAuthUrl(state: string) {
    const scopes = (process.env.GA_SCOPES || 'https://www.googleapis.com/auth/analytics.readonly').split(',');
    return this.oauth.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: scopes,
      state,
      redirect_uri: process.env.GA_REDIRECT_URI,
    });
  }

  /** Intercambia code por tokens y persiste */
  async exchangeCode(userId: string, code: string) {
    const { tokens } = await this.oauth.getToken({
      code,
      redirect_uri: process.env.GA_REDIRECT_URI,
    });
    if (!tokens.access_token) throw new Error('No se obtuvo access_token');

    const tokenData: TokenSet = {
      access_token: tokens.access_token!,
      refresh_token: tokens.refresh_token ?? undefined,
      expiry_date: tokens.expiry_date ?? undefined,
      scope: tokens.scope,
      token_type: tokens.token_type ?? undefined,
      id_token: tokens.id_token ?? undefined,
    };

    const existing = await this.gaRepo.findOne({ where: { user: { id: userId } } });
    const merged = {
      ...(existing?.data ?? {}),
      tokens: tokenData,
      obtained_at: new Date().toISOString(),
    };
    return this.saveGaData(userId, merged, existing?.metrics);
  }

  /**
   * Devuelve headers con Bearer listo para usar,
   * refrescando tokens si hace falta.
   */
  private async getRequestHeadersFor(
    host: 'data' | 'admin',
    userId: string
  ) {
    const entry = await this.gaRepo.findOne({ where: { user: { id: userId } } });
    if (!entry?.data?.tokens?.access_token) throw new Error('GA no vinculado');

    const t: TokenSet = entry.data.tokens;
    this.oauth.setCredentials(t);

    // Diferenciar entre Data API y Admin API
    const audience =
      host === 'data'
        ? 'https://analyticsdata.googleapis.com/'
        : 'https://analyticsadmin.googleapis.com/';

    const headers = await this.oauth.getRequestHeaders(audience);

    // Actualizar tokens si Google hizo refresh
    const creds = this.oauth.credentials;
    if (creds?.access_token && creds.access_token !== t.access_token) {
      entry.data.tokens = {
        access_token: creds.access_token!,
        refresh_token: creds.refresh_token ?? t.refresh_token,
        expiry_date: creds.expiry_date,
        scope: creds.scope ?? t.scope,
        token_type: creds.token_type ?? t.token_type,
        id_token: creds.id_token ?? t.id_token,
      };
      await this.gaRepo.save(entry);
    }

    return headers;
  }

  /** Guarda la GA4 property elegida por el usuario */
  async linkProperty(userId: string, propertyId: string) {
    const entry = await this.gaRepo.findOne({ where: { user: { id: userId } } });
    if (!entry) throw new Error('GA no vinculado');
    entry.data = { ...(entry.data ?? {}), propertyId };
    const saved = await this.gaRepo.save(entry);

    // subir metadato mínimo a GCS
    try {
      const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['gaAnalytics'] });
      const tenant = emailToTenant(user?.email, userId);
      await this.gcs.ensureTenantPrefix(tenant, 'ga');

      const p = buildObjectPath(tenant, 'ga', 'property', 'json');
      await this.gcs.uploadJson(p, { userId, propertyId, linked_at: new Date().toISOString() });
    } catch (e: any) {
      console.warn('[GA→GCS] property:', e?.message);
    }

    return saved;
  }

  /**
   * Snapshot de métricas (SERIE DIARIA) y persistencia en BD + GCS
   * - si no pasás start/end, usa hoy y hoy-1 año
   */
  async fetchMetrics(
    userId: string,
    params: {
      propertyId?: string;
      startDate?: string;
      endDate?: string;
      metrics?: string[];
    }
  ) {
    const entry = await this.gaRepo.findOne({ where: { user: { id: userId } }, relations: ['user'] });
    if (!entry) throw new Error('GA no vinculado');

    const propertyId = params.propertyId || entry.data?.propertyId;
    if (!propertyId) throw new Error('Falta propertyId');

    const headers = await this.getRequestHeadersFor('data', userId);

    const today = new Date();
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    const end = (params.endDate ?? today.toISOString().slice(0, 10));
    const start = (params.startDate ?? oneYearAgo.toISOString().slice(0, 10));

    // Métricas por defecto (válidas en GA4)
    const metricNames = params.metrics?.length
      ? params.metrics
      : [
        'sessions',
        'transactions',
        'purchaseRevenue',
        'averagePurchaseRevenue',
        'sessionKeyEventRate:purchase',
      ];
    const metrics = metricNames.map((m) => ({ name: m }));

    const url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;

    // -------- Serie DIARIA (una fila por día) ----------
    const dailyBody = {
      dateRanges: [{ startDate: start, endDate: end }],
      metrics,
      dimensions: [{ name: 'date' }], // YYYYMMDD
      orderBys: [{ dimension: { dimensionName: 'date' } }],
    };

    const { data: dailyData } = await axios.post(url, dailyBody, { headers });
    const daily =
      dailyData?.rows?.map((r: any) => {
        const d = r.dimensionValues?.[0]?.value; // "YYYYMMDD"
        const mvals = r.metricValues || [];
        const pick = (name: string) => {
          const ix = metricNames.findIndex((n) => n === name);
          return mvals?.[ix]?.value ?? '0';
        };
        const S = Number(pick('sessions') || 0);
        const T = Number(pick('transactions') || 0);
        let R = Number(pick('sessionKeyEventRate:purchase') || 0);
        if ((!R || isNaN(R)) && S > 0) R = T / S;

        return {
          date: d,
          sessions: S,
          transactions: T,
          purchaseRevenue: Number(pick('purchaseRevenue') || 0),
          averagePurchaseRevenue: Number(pick('averagePurchaseRevenue') || 0),
          purchaseConversionRate: Number.isFinite(R) ? Number(R.toFixed(6)) : 0,
        };
      }) ?? [];

    const snapshot = {
      fetched_at: new Date().toISOString(),
      userId,
      propertyId,
      startDate: start,
      endDate: end,
      series: { daily },
    };


    entry.metrics = snapshot;
    await this.gaRepo.save(entry);

    const tenant = emailToTenant(entry.user?.email, userId);
    await this.gcs.ensureTenantPrefix(tenant, 'ga');
    const snapshotPath = buildObjectPath(
      tenant,
      'ga',
      `snapshot-${propertyId}`, 
      'json'
    );

    console.info('[GA→GCS] Subiendo snapshot a:', snapshotPath);
    try {
      await this.gcs.uploadJson(snapshotPath, snapshot);
    } catch (err) {
      console.error('[GA→GCS] ERROR al subir snapshot:', err);
      throw err;
    }

    return snapshot;
  }

  /**
   * Lista las propiedades GA4 disponibles para el usuario (Admin API)
   */
  async listUserGaProperties(userId: string) {
    const headers = await this.getRequestHeadersFor('admin', userId);

    const url = 'https://analyticsadmin.googleapis.com/v1beta/accountSummaries';
    const { data } = await axios.get(url, { headers });

    const summaries = data?.accountSummaries ?? [];

    const properties: Array<{ id: string; name: string }> = [];
    for (const acc of summaries) {
      const props = acc.propertySummaries ?? [];
      for (const p of props) {
        const id = String(p.property).split('/').pop();
        properties.push({ id: id!, name: p.displayName ?? id });
      }
    }

    return properties;
  }

  /**
     * Metodo para eliminar campaña por userId
     */
  async deleteUserData(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['gaAnalytics'] });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (!user.gaAnalytics) return { success: true };
    await this.gaRepo.delete(user.gaAnalytics.id);
    user.gaAnalytics = null!;
    await this.userRepo.save(user);
    return { success: true };
  }
}
