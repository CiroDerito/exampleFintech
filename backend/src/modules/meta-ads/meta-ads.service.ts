 import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
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
  const month = opts?.month ?? 'last_month';

  const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['metaAds'] });
  if (!user?.metaAds) throw new Error('Meta Ads no vinculado');

  const dataObj =
    typeof user.metaAds.data === 'string'
      ? (() => { try { return JSON.parse(user.metaAds.data); } catch { return {}; } })()
      : (user.metaAds.data ?? {});
  const accessToken = dataObj.access_token;
  if (!accessToken) throw new Error('Falta access_token');

  let account = accountId || user.metaAds.accountId;
  if (!account) throw new Error('Falta accountId');
  // Limpiar prefijo 'act_' si ya lo tiene
  account = account.replace(/^act_/, '');
  const base = `https://graph.facebook.com/${this.apiVersion}/act_${account}/insights`;
  const params: any = {
    access_token: accessToken,
    level: 'campaign',
    date_preset: month,
    time_increment: 1,
    fields: [
      'date_start','date_stop',
      'campaign_id','campaign_name',
      'spend','impressions','clicks','ctr',
    ].join(','),
    limit: 500,
  };

  if (opts?.campaignId) {
    params.filtering = JSON.stringify([
      { field: 'campaign.id', operator: 'IN', value: [opts.campaignId] }
    ]);
  }

  const rows: any[] = [];
  let nextUrl: string | null = base;
  let nextParams: any = params;

  while (nextUrl) {
    const { data } = await axios.get(nextUrl, { params: nextParams });
    rows.push(...(data?.data ?? []));
    nextUrl = data?.paging?.next ?? null;
    nextParams = undefined;
  }

  const metrics = rows.map((r: any) => ({
    month,
    cost: Number(r.spend || 0),
    impressions: Number(r.impressions || 0),
    link_clicks: Number(r.clicks || 0),
    ctr: parseFloat(r.ctr || 0),
    campaign_id: r.campaign_id,
    campaign_name: r.campaign_name,
    date_start: r.date_start,
    date_stop: r.date_stop,
  }));

  // Guardar en campaigns array
  if (!Array.isArray(user.metaAds.metrics)) user.metaAds.metrics = [];
  // Si se especifica campaignId, actualiza o agrega solo esa campaña
  if (opts?.campaignId) {
    const idx = user.metaAds.metrics.findIndex(c => c.campaign_id === opts.campaignId);
    if (idx >= 0) {
      user.metaAds.metrics[idx] = { ...metrics[0], updated_at: new Date().toISOString() };
    } else {
      user.metaAds.metrics.push({ ...metrics[0], updated_at: new Date().toISOString() });
    }
  } else {
    // Si no hay campaignId, reemplaza todo el array
    user.metaAds.metrics = metrics.map(m => ({ ...m, updated_at: new Date().toISOString() }));
  }
  // Persistir también en data.metrics para compatibilidad
  dataObj.metrics = metrics;
  user.metaAds.data = dataObj;
  await this.metaAdsRepo.save(user.metaAds);

  return metrics;
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
