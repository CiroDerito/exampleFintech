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
}
