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
  user_id: number; // store_id
};

const API_BASE = 'https://api.tiendanube.com/2025-03'; // recomendado

function tnHeaders(token: string) {
  return {
    'Authentication': `bearer ${token}`, // <- clave: header "Authentication" + bearer en minúsculas
    'User-Agent': process.env.TIENDANUBE_USER_AGENT || 'MiApp (soporte@miapp.com)',
    'Content-Type': 'application/json',
  };
}

function parseLinkHeader(link?: string | null) {
  if (!link) return null;
  // Formato: <https://.../resource?page=2&per_page=10>; rel="next", <...>; rel="previous"
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
    client_id: string; client_secret: string; code: string; redirect_uri?: string;
  }): Promise<TokenResp> {
    const resp = await firstValueFrom(this.http.post(
      'https://www.tiendanube.com/apps/authorize/token',
      { ...body, grant_type: 'authorization_code' },
      { headers: { 'Content-Type': 'application/json' } },
    ));
    return resp.data as TokenResp;
  }

  async saveConnection(conn: { storeId: string; accessToken: string; scope: string; userId: string }) {
    const user = await this.userRepo.findOne({ where: { id: conn.userId } });
    if (!user) throw new BadRequestException('Usuario no encontrado');

    let tn = await this.tiendaNubeRepo
      .createQueryBuilder('tn')
      .where("tn.data->>'user_id' = :sid", { sid: conn.storeId })
      .getOne();

    if (!tn) {
      tn = this.tiendaNubeRepo.create({
        user,
        data: { user_id: conn.storeId, access_token: conn.accessToken, scope: conn.scope },
      });
    } else {
      tn.user = user;
      tn.data = { user_id: conn.storeId, access_token: conn.accessToken, scope: conn.scope };
    }
    await this.tiendaNubeRepo.save(tn);
  }

  async getConnection(storeId: string) {
    const tn = await this.tiendaNubeRepo
      .createQueryBuilder('tn')
      .where("tn.data->>'user_id' = :sid", { sid: storeId })
      .getOne();
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
    return {
      data: resp.data,
      links: parseLinkHeader(resp.headers?.link),
    };
  }

  async getOrders(storeId: string, params: Record<string, any> = {}) {
    const { accessToken } = await this.getConnection(storeId);
    const url = `${API_BASE}/${storeId}/orders`;
    const resp = await this.get(url, accessToken, params);
    return {
      data: resp.data,
      links: parseLinkHeader(resp.headers?.link),
    };
  }

  async getCustomers(storeId: string, params: Record<string, any> = {}) {
    const { accessToken } = await this.getConnection(storeId);
    const url = `${API_BASE}/${storeId}/customers`;
    const resp = await this.get(url, accessToken, params);
    return {
      data: resp.data,
      links: parseLinkHeader(resp.headers?.link),
    };
  }

  // ---------- RawData inicial ----------

  async fetchAndSaveRawData(storeId: string, accessToken: string) {
    const rawData: Record<string, any> = {};
    const commonParams = { per_page: 10 };

    try {
      const r = await this.get(`${API_BASE}/${storeId}/products`, accessToken, commonParams);
      rawData.productos = r.data;
    } catch (e) {
      console.warn('Productos:', e?.response?.status || e?.message);
    }

    try {
      const r = await this.get(`${API_BASE}/${storeId}/orders`, accessToken, commonParams);
      rawData.ventas = r.data;
    } catch (e) {
      console.warn('Ventas:', e?.response?.status || e?.message);
    }

    try {
      const r = await this.get(`${API_BASE}/${storeId}/customers`, accessToken, commonParams);
      rawData.clientes = r.data;
    } catch (e) {
      console.warn('Clientes:', e?.response?.status || e?.message);
    }

    // Nota: no existe endpoint de listado general de "envíos".
    // La info de envío está en cada order. Si integrás un carrier, es otro flujo.

    const tn = await this.tiendaNubeRepo
      .createQueryBuilder('tn')
      .where("tn.data->>'user_id' = :sid", { sid: storeId })
      .getOne();

    if (tn) {
      tn.rawData = rawData;
      await this.tiendaNubeRepo.save(tn);
    }
    return tn?.rawData;
  }


}
