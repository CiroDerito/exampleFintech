import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TiendaNube } from './entities/tienda-nube.entity';
import { User } from '../users/entities/user.entity';
import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';

type TokenResp = {
  access_token: string;
  token_type: 'bearer';
  scope: string;
  user_id: number; // store_id (stringifícalo al guardar)
};

const API_BASE = 'https://api.tiendanube.com/2025-03';

function tnHeaders(token: string) {
  return {
    // Tiendanube usa exactamente este header:
    'Authentication': `bearer ${token}`, // 'bearer' en minúsculas
    'User-Agent': process.env.TIENDANUBE_USER_AGENT || 'MiApp (soporte@miapp.com)',
    'Content-Type': 'application/json',
  };
}

function parseLinkHeader(link?: string | null) {
  if (!link) return null;
  const parts = link.split(',').map(s => s.trim());
  const out: Record<string, string> = {};
  for (const p of parts) {
    const m = p.match(/^<([^>]+)>;\s*rel="([^"]+)"$/);
    if (m) out[m[2]] = m[1];
  }
  return out;
}

@Injectable()
export class TiendaNubeService {
  constructor(
    @InjectRepository(TiendaNube)
    private readonly tiendaNubeRepo: Repository<TiendaNube>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly http: HttpService,
  ) {}

  // ---------- OAuth ----------

  async exchangeCodeForToken(body: {
    client_id: string;
    client_secret: string;
    code: string;
    redirect_uri?: string;
  }): Promise<TokenResp> {
    const resp = await firstValueFrom(
      this.http.post(
        'https://www.tiendanube.com/apps/authorize/token',
        { ...body, grant_type: 'authorization_code' },
        { headers: { 'Content-Type': 'application/json' } },
      ),
    );
    return resp.data as TokenResp;
  }

  /**
   * Guarda/actualiza la conexión y la enlaza al user (FK en users).
   * Requiere que TiendaNube.storeId exista en la entidad.
   */
  async saveConnection(conn: {
    storeId: string;        // user_id de TiendaNube (string)
    accessToken: string;
    scope: string;
    userId: string;         // UUID del User
  }) {
    const user = await this.userRepo.findOne({
      where: { id: conn.userId },
      relations: ['tiendaNube'],
    });
    if (!user) throw new BadRequestException('Usuario no encontrado');

    // 1) Buscá por columna storeId (no por JSON)
    let tn = await this.tiendaNubeRepo.findOne({ where: { storeId: conn.storeId } });

    // 2) Crear/actualizar
    if (!tn) {
      tn = this.tiendaNubeRepo.create({
        storeId: conn.storeId, // 👈 OBLIGATORIO
        data: {
          access_token: conn.accessToken,
          scope: conn.scope,
        },
      });
    } else {
      tn.storeId = conn.storeId; // por si acaso
      tn.data = {
        access_token: conn.accessToken,
        scope: conn.scope,
      };
    }

    tn = await this.tiendaNubeRepo.save(tn);

    // 3) Enlazar desde el lado USER (dueño del FK)
    user.tiendaNube = tn;
    await this.userRepo.save(user);

    return { tiendaNubeId: tn.id, storeId: conn.storeId };
  }

  async getConnection(storeId: string) {
    const tn = await this.tiendaNubeRepo.findOne({ where: { storeId } });
    if (!tn) throw new BadRequestException('No connection found');
    return { accessToken: tn.data.access_token as string };
  }

  // ---------- Helpers de requests ----------

  private async get<T = any>(url: string, token: string, params?: Record<string, any>) {
    const resp: AxiosResponse<T> = await firstValueFrom(
      this.http.get(url, { headers: tnHeaders(token), params, validateStatus: () => true }),
    );
    if (resp.status >= 400) {
      throw new BadRequestException({
        message: 'Tiendanube GET error',
        status: resp.status,
        url,
        data: resp.data,
      });
    }
    return resp;
  }

  // ---------- Recursos ----------

  async getProducts(storeId: string, params: Record<string, any> = {}) {
    const { accessToken } = await this.getConnection(storeId);
    const url = `${API_BASE}/${storeId}/products`;
    const resp = await this.get(url, accessToken, params);
    return { data: resp.data, links: parseLinkHeader(resp.headers?.link) };
  }

  async getOrders(storeId: string, params: Record<string, any> = {}) {
    const { accessToken } = await this.getConnection(storeId);
    const url = `${API_BASE}/${storeId}/orders`;
    const resp = await this.get(url, accessToken, params);
    return { data: resp.data, links: parseLinkHeader(resp.headers?.link) };
  }

  async getCustomers(storeId: string, params: Record<string, any> = {}) {
    const { accessToken } = await this.getConnection(storeId);
    const url = `${API_BASE}/${storeId}/customers`;
    const resp = await this.get(url, accessToken, params);
    return { data: resp.data, links: parseLinkHeader(resp.headers?.link) };
  }

  // ---------- RawData inicial ----------

  async getRawDataByUserId(userId: string) {
    // FK en users → traemos el user con su tiendaNube
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['tiendaNube'],
    });
    return user?.tiendaNube?.rawData ?? null;
  }

  async fetchAndSaveRawData(storeId: string, accessToken: string) {
    const rawData: Record<string, any> = {};
    const commonParams = { per_page: 10 };

    try {
      const r = await this.get(`${API_BASE}/${storeId}/products`, accessToken, commonParams);
      rawData.productos = r.data;
    } catch (e: any) {
      console.warn('Productos:', e?.response?.status || e?.message);
    }

    try {
      const r = await this.get(`${API_BASE}/${storeId}/orders`, accessToken, commonParams);
      rawData.ventas = r.data;
    } catch (e: any) {
      console.warn('Ventas:', e?.response?.status || e?.message);
    }

    try {
      const r = await this.get(`${API_BASE}/${storeId}/customers`, accessToken, commonParams);
      rawData.clientes = r.data;
    } catch (e: any) {
      console.warn('Clientes:', e?.response?.status || e?.message);
    }

    const tn = await this.tiendaNubeRepo.findOne({ where: { storeId } });
    if (tn) {
      tn.rawData = rawData;
      await this.tiendaNubeRepo.save(tn);
      return tn.rawData;
    }
    return null;
  }

  /**
   * Compara la última fecha de métrica guardada con el last_login y actualiza la diferencia en días (solo 1 vez por día)
   * Guarda el resultado en rawData
   */
  async getMetricsDiffLogin(userId: string): Promise<{ lastMetricDate: string|null, lastLogin: string|null, diffDays: number|null }> {
    const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['tiendaNube'] });
    const tiendaNube = user?.tiendaNube;
    if (!tiendaNube || !Array.isArray(tiendaNube.rawData?.metrics) || tiendaNube.rawData.metrics.length === 0) {
      const lastLoginStr = user?.last_login ? new Date(user.last_login).toISOString() : null;
      return { lastMetricDate: null, lastLogin: lastLoginStr, diffDays: null };
    }
    // Control de ejecución: solo una vez por día
    const now = new Date();
    const lastUpdate = tiendaNube.rawData?.metrics_diff_login_last_update ? new Date(tiendaNube.rawData.metrics_diff_login_last_update) : null;
    if (lastUpdate && (now.getTime() - lastUpdate.getTime()) < 24 * 60 * 60 * 1000) {
      // Si ya se actualizó hoy, no hacer nada
      return { lastMetricDate: null, lastLogin: null, diffDays: null };
    }
    // Buscar la última fecha de métrica guardada
    let lastMetricDateStr: string | null = null;
    if (Array.isArray(tiendaNube.rawData.metrics) && tiendaNube.rawData.metrics.length > 0) {
      const lastMetric = tiendaNube.rawData.metrics.reduce((max: any, m: any) => {
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
    // Actualizar rawData con el resultado
    tiendaNube.rawData = {
      ...tiendaNube.rawData,
      metrics_diff_login: { lastMetricDate: lastMetricDateStr, lastLogin: lastLoginStr, diffDays, updated_at: now.toISOString() },
      metrics_diff_login_last_update: now.toISOString(),
    };
    await this.tiendaNubeRepo.save(tiendaNube);
    return { lastMetricDate: lastMetricDateStr, lastLogin: lastLoginStr, diffDays };
  }
}
