 import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { subMonths, startOfMonth, endOfMonth, format, parseISO, eachDayOfInterval } from 'date-fns';
import { MetaAds } from './entities/meta-ads.entity';
import { User } from '../users/entities/user.entity';

type TokenResponse = {
  access_token: string;
  token_type?: string;
  expires_in?: number;
};

@Injectable()
export class MetaAdsService {
  constructor(
    @InjectRepository(MetaAds)
    private readonly metaAdsRepo: Repository<MetaAds>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  private apiVersion = process.env.META_API_VERSION || 'v23.0';

  /** Upsert de la relación MetaAds del usuario */
  async saveMetaAdsData(
    userId: string,
    accountId?: string | null,
    data?: any,
    processData?: any
  ) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    let meta = await this.metaAdsRepo.findOne({ where: { user: { id: userId } } });
    if (!meta) {
      meta = this.metaAdsRepo.create({
        user,
        accountId: accountId ?? undefined,
        data: data ?? undefined,
        processData: processData ?? undefined,
      });
    } else {
      if (typeof accountId === 'string') meta.accountId = accountId;
      if (typeof data !== 'undefined') meta.data = data;
      if (typeof processData !== 'undefined') meta.processData = processData;
    }

    meta = await this.metaAdsRepo.save(meta);
    user.metaAds = meta;
    await this.userRepo.save(user);
    return meta;
  }

  // ============ OAUTH ============

  /** Paso 1: code -> short-lived user token */
  async exchangeCodeForShortLivedToken(code: string): Promise<TokenResponse> {
    const url = `https://graph.facebook.com/${this.apiVersion}/oauth/access_token`;
    const params = {
      client_id: process.env.META_CLIENT_ID,
      redirect_uri: process.env.META_REDIRECT_URI,
      client_secret: process.env.META_CLIENT_SECRET,
      code,
    };
    const { data } = await axios.get<TokenResponse>(url, { params });
    return data;
  }

  /** Paso 2 (recomendado): short-lived -> long-lived (~60 días) */
  async exchangeShortForLongLived(shortToken: string): Promise<TokenResponse> {
    const url = `https://graph.facebook.com/${this.apiVersion}/oauth/access_token`;
    const params = {
      grant_type: 'fb_exchange_token',
      client_id: process.env.META_CLIENT_ID,
      client_secret: process.env.META_CLIENT_SECRET,
      fb_exchange_token: shortToken,
    };
    const { data } = await axios.get<TokenResponse>(url, { params });
    return data;
  }

  // ============ AD ACCOUNTS ============

  /** Lista las ad accounts del usuario a partir de un access_token */
  async listUserAdAccounts(accessToken: string) {
    const base = `https://graph.facebook.com/${this.apiVersion}/me/adaccounts`;
    const params: any = {
      access_token: accessToken,
      fields: 'id,account_id,name,account_status,currency',
      limit: 100,
    };

    const all: any[] = [];
    let nextUrl: string | null = base;
    let nextParams: any = params;

    while (nextUrl) {
      const { data } = await axios.get(nextUrl, { params: nextParams });
      all.push(...(data.data || []));
      nextUrl = data.paging?.next || null;
      nextParams = undefined; // la URL "next" ya trae query completa
    }

    return all;
  }

  /** Helper: usa el token guardado del user para listar sus ad accounts */
  async listUserAdAccountsForUser(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['metaAds'] });
    const token = user?.metaAds?.data?.access_token;
    if (!token) throw new Error('Meta no vinculado o sin access_token');
    return this.listUserAdAccounts(token);
  }

  /** Guarda la ad account elegida por el usuario */
  async linkAdAccount(userId: string, accountId: string) {
  const meta = await this.metaAdsRepo.findOne({ where: { user: { id: userId } }, relations: ['user'] });
  if (!meta) throw new Error('Meta Ads no vinculado');
  // Solo se permite una cuenta vinculada por usuario
  meta.accountId = accountId;
  // Si existía alguna otra info de cuentas, se limpia
  // Si quieres guardar historial, aquí podrías hacerlo
  return this.metaAdsRepo.save(meta);
  }

  // ============ INSIGHTS ============

  /** Versión simple (compat): code -> token (usa short-lived) */
  async exchangeCodeForToken(code: string) {
    // Podés cambiar a long-lived si lo preferís:
    const short = await this.exchangeCodeForShortLivedToken(code);
    return short;
  }


  async listCampaignsForAccount(userId: string, accountId: string) {
  const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['metaAds'] });
  if (!user?.metaAds) throw new Error('Meta Ads no vinculado');

  const dataObj =
    typeof user.metaAds.data === 'string'
      ? (() => { try { return JSON.parse(user.metaAds.data); } catch { return {}; } })()
      : (user.metaAds.data ?? {});
  const accessToken = dataObj.access_token;
  if (!accessToken) throw new Error('Falta access_token');

  const base = `https://graph.facebook.com/${this.apiVersion}/act_${accountId}/campaigns`;
  const params: any = {
    access_token: accessToken,
    fields: 'id,name,status,objective,effective_status',
    limit: 200,
  };

  const all: any[] = [];
  let nextUrl: string | null = base;
  let nextParams: any = params;
  while (nextUrl) {
    const { data } = await axios.get(nextUrl, { params: nextParams });
    all.push(...(data?.data ?? []));
    nextUrl = data?.paging?.next ?? null;
    nextParams = undefined; //ya incluye query completa
  }
  return all;
}
/**
 * Obtiene métricas de campañas de Meta Ads para el usuario vinculado
 * @param userId UUID del usuario
 * @param accountId ID de la cuenta publicitaria
 * @param opts Opciones: month, campaignId
 */
async getCampaignInsights(
  userId: string,
  accountId: string,
  opts?: { month?: string; campaignId?: string }
) {
  const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['metaAds'] });
  const metaAds = user?.metaAds;
  if (!metaAds) throw new Error('Meta Ads no vinculado');

  const dataObj =
    typeof metaAds.data === 'string'
      ? (() => { try { return JSON.parse(metaAds.data); } catch { return {}; } })()
      : (metaAds.data ?? {});

  const accessToken = (dataObj as any).access_token;
  if (!accessToken) throw new Error('Falta access_token');

  let account = accountId || metaAds.accountId;
  if (!account) throw new Error('Falta accountId');
  account = account.replace(/^act_/, '');

  // ---- últimos 12 meses (cortar mes actual en "hoy") ----
  const months: { since: string; until: string; labelDate: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = subMonths(now, i);
    const since = format(startOfMonth(d), 'yyyy-MM-dd');

    const until =
      d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        ? format(now, 'yyyy-MM-dd') // mes actual -> hasta hoy
        : format(endOfMonth(d), 'yyyy-MM-dd'); // meses pasados -> hasta fin de mes

    const labelDate = format(startOfMonth(d), 'yyyy-MM-01');
    months.push({ since, until, labelDate });
  }
  months.reverse();

  // ---- campañas ----
  const allCampaigns = await this.listCampaignsForAccount(userId, account);
  const campaigns = opts?.campaignId
    ? allCampaigns.filter((c: any) => c.id === opts!.campaignId)
    : allCampaigns;

  const toNum = (v: any) => {
    const n = typeof v === 'string' ? parseFloat(v) : (typeof v === 'number' ? v : 0);
    return Number.isFinite(n) ? n : 0;
  };

  const getActionValue = (arr: any[], type: string) => {
    if (!Array.isArray(arr)) return 0;
    const obj = arr.find((a) => a.action_type === type);
    return obj ? toNum(obj.value) : 0;
  };

  const byCampaign: any[] = [];
  for (const camp of campaigns) {
    const monthsArr: any[] = [];

    for (const m of months) {
      const base = `https://graph.facebook.com/${this.apiVersion}/act_${account}/insights`;
      const params: any = {
        access_token: accessToken,
        level: 'campaign',
        time_range: JSON.stringify({ since: m.since, until: m.until }),
        time_increment: 1,
        fields: [
          'date_start','date_stop',
          'campaign_id','campaign_name',
          'spend','impressions','clicks','ctr',
          'inline_link_clicks','unique_inline_link_clicks',
          'actions','action_values','cost_per_action_type',
        ].join(','),
        filtering: JSON.stringify([
          { field: 'campaign.id', operator: 'IN', value: [camp.id] }
        ]),
        limit: 1000,
      };

      const { data } = await axios.get(base, { params });

      const rows: any[] = data?.data ?? [];
      const rowsByDate = new Map<string, any>();
      for (const r of rows) rowsByDate.set(r.date_start, r);

      const expectedDays = eachDayOfInterval({
        start: parseISO(m.since),
        end: parseISO(m.until),
      });

      const days = expectedDays.map((d) => {
        const key = format(d, 'yyyy-MM-dd');
        const row = rowsByDate.get(key);
        return {
          date: key,
          spend: row ? toNum(row.spend) : 0,
          impressions: row ? toNum(row.impressions) : 0,
          clicks: row ? toNum(row.clicks) : 0,
          ctr: row ? toNum(row.ctr) : 0,
          inline_link_clicks: row ? toNum(row.inline_link_clicks) : 0,
          unique_inline_link_clicks: row ? toNum(row.unique_inline_link_clicks) : 0,
          website_purchases: row ? getActionValue(row.actions, 'offsite_conversion.fb_pixel_purchase') : 0,
          website_purchase_conversion_value: row ? getActionValue(row.action_values, 'offsite_conversion.fb_pixel_purchase') : 0,
          cost_per_website_purchase: row ? getActionValue(row.cost_per_action_type, 'offsite_conversion.fb_pixel_purchase') : 0,
        };
      });

      monthsArr.push({
        month: m.labelDate,
        campaign_id: camp.id,
        campaign_name: camp.name,
        days,
      });
    }

    monthsArr.sort((a, b) => a.month.localeCompare(b.month));

    byCampaign.push({
      campaign_id: camp.id,
      campaign_name: camp.name,
      months: monthsArr,
    });
  }

  byCampaign.sort((a, b) =>
    a.campaign_name.localeCompare(b.campaign_name, 'es', { sensitivity: 'base', numeric: true })
  );

  const byName = Object.fromEntries(byCampaign.map(c => [c.campaign_name, c]));

  metaAds.metrics = byCampaign;
  metaAds.data = {
    ...dataObj,
    metrics_last_update: new Date().toISOString(),
  };
  await this.metaAdsRepo.save(metaAds);

  return { campaigns: byCampaign, byName };
}
 /**
   * Método público para obtener usuario por ID
   */
  /**
   * Método público para obtener usuario por ID
   */
  async getUserById(userId: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { id: userId } });
  }



  /**
   * Devuelve la fecha de último login del usuario
   */
  async getLastLoginDate(userId: string): Promise<string | null> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
  const lastLogin = user?.last_login || user?.updatedAt;
    return lastLogin ? new Date(lastLogin).toISOString().slice(0, 10) : null;
  }

    /**
   * Compara la última fecha de métrica guardada con el last_login y devuelve la diferencia en días
   */
  async getMetricsDiffLogin(userId: string): Promise<{ lastMetricDate: string|null, lastLogin: string|null, diffDays: number|null }> {
    const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['metaAds'] });
    if (!user?.metaAds) {
      const lastLoginStr = user?.last_login ? new Date(user.last_login).toISOString() : null;
      return { lastMetricDate: null, lastLogin: lastLoginStr, diffDays: null };
    }
    // Control de ejecución: solo una vez por día
    const now = new Date();
    const lastUpdate = user.metaAds.data?.metrics_last_update ? new Date(user.metaAds.data.metrics_last_update) : null;
    if (lastUpdate && (now.getTime() - lastUpdate.getTime()) < 24 * 60 * 60 * 1000) {
      // Si ya se actualizó hoy, no hacer nada
      return { lastMetricDate: null, lastLogin: null, diffDays: null };
    }
    // Buscar la última fecha de métrica guardada
  let lastMetricDateStr: string | null = null;
    if (Array.isArray(user.metaAds.metrics) && user.metaAds.metrics.length > 0) {
      const lastMetric = user.metaAds.metrics.reduce((max, m) => {
        const d = new Date(m.date_stop);
        return (!max || d > new Date(max.date_stop)) ? m : max;
      }, null);
      lastMetricDateStr = lastMetric && lastMetric.date_stop ? new Date(lastMetric.date_stop).toISOString() : null;
    }
    const lastLoginStr = user?.last_login ? new Date(user.last_login).toISOString() : null;
    let diffDays: number | null = null;
    if (lastMetricDateStr && lastLoginStr) {
      const metricDate = new Date(lastMetricDateStr);
      const loginDate = new Date(lastLoginStr);
      diffDays = Math.floor((loginDate.getTime() - metricDate.getTime()) / (1000 * 60 * 60 * 24));
    }
    // Actualizar metrics con el resultado
    user.metaAds.metrics = user.metaAds.metrics || [];
    user.metaAds.metrics.push({ lastMetricDate: lastMetricDateStr, lastLogin: lastLoginStr, diffDays, updated_at: now.toISOString() });
    // Guardar la fecha de última actualización en data
    user.metaAds.data = {
      ...user.metaAds.data,
      metrics_last_update: now.toISOString(),
    };
    await this.metaAdsRepo.save(user.metaAds);
    return { lastMetricDate: lastMetricDateStr, lastLogin: lastLoginStr, diffDays };
  }

}
