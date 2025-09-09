import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TiendaNube } from './entities/tienda-nube.entity';
import { User } from '../users/entities/user.entity';
import { Injectable, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';
import { buildObjectPath, buildSnapshotPath } from 'src/gcs/path';
import { GcsService } from 'src/gcs/gcs.service';
import { emailToTenant } from 'src/gcs/tenant.util';

type TokenResp = {
  access_token: string;
  token_type: 'bearer';
  scope: string;
  user_id: number;
};

const API_BASE = 'https://api.tiendanube.com/2025-03';

function tnHeaders(token: string) {
  return {
    'Authentication': `bearer ${token}`,
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
    private readonly gcs: GcsService,
  ) { }

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
    storeId: string;
    accessToken: string;
    scope: string;
    userId: string;
  }) {
    const user = await this.userRepo.findOne({
      where: { id: conn.userId },
      relations: ['tiendaNube'],
    });
    if (!user) throw new BadRequestException('Usuario no encontrado');

    let tn = await this.tiendaNubeRepo.findOne({ where: { storeId: conn.storeId } });

    if (!tn) {
      tn = this.tiendaNubeRepo.create({
        storeId: conn.storeId,
        data: {
          access_token: conn.accessToken,
          scope: conn.scope,
        },
      });
    } else {
      tn.storeId = conn.storeId;
      tn.data = {
        access_token: conn.accessToken,
        scope: conn.scope,
      };
    }

    tn = await this.tiendaNubeRepo.save(tn);

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
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['tiendaNube'],
    });
    return user?.tiendaNube?.rawData ?? null;
  }

  async fetchAndSaveRawData(storeId: string, accessToken: string, tenantEmail?: string) {
  const rawData: Record<string, any> = {};

  // 1) Resolver email si no vino (usando los repos ya inyectados en el service)
  if (!tenantEmail) {
    try {
      const tnConn = await this.tiendaNubeRepo.findOne({ where: { storeId } });
      const linkedUserId =
        (tnConn as any)?.userId ??
        (tnConn as any)?.user_id ??
        (tnConn as any)?.user?.id;

      if (linkedUserId) {
        const u = await this.userRepo.findOne({ where: { id: linkedUserId } as any });
        tenantEmail = u?.email;
      }
    } catch { /* noop */ }
  }

  // 2) Prefijo en GCS → email (normalizado) o fallback = storeId
  const tenant = emailToTenant(tenantEmail, storeId);

  // 3) (opcional) marcar prefijo lógico para el proveedor
  try {
    await this.gcs.ensureTenantPrefix(tenant, 'tiendanube');
  } catch (e: any) {
    console.warn('[GCS ensureTenantPrefix] warn:', e?.message);
  }

  console.log('[TN→GCS] tenant=', tenant, 'storeId=', storeId, 'email=', tenantEmail);

  // ---------- Ventana temporal (último año) ----------
  const sinceDate = new Date();
  sinceDate.setFullYear(sinceDate.getFullYear() - 1);
  const since = sinceDate.toISOString().slice(0, 10);

  // ---------- Paginación ----------
  const PER_PAGE = 50;
  const MAX_PAGES_PRODUCTS  = 5;
  const MAX_PAGES_ORDERS    = 5;
  const MAX_PAGES_CUSTOMERS = 1;

  // Helper de paginación
  const fetchPaged = async (resource: 'products' | 'orders' | 'customers', maxPages: number) => {
    const all: any[] = [];
    for (let page = 1; page <= maxPages; page++) {
      try {
        const r = await this.get(
          `${API_BASE}/${storeId}/${resource}`,
          accessToken,
          { per_page: PER_PAGE, page, since }
        );
        const items = Array.isArray(r.data) ? r.data : [];
        all.push(...items);
        if (items.length < PER_PAGE) break;
      } catch (e: any) {
        console.warn(`${resource} page=${page}:`, e?.response?.status || e?.message);
        break;
      }
    }
    return all;
  };

  // ---------- PRODUCTS + resumen ----------
  try {
    const productsRaw = await fetchPaged('products', MAX_PAGES_PRODUCTS);
    const toNumber = (v: any) => (v == null ? 0 : Number(v) || 0);

    const productos = productsRaw.map((p: any) => {
      let stock_total = 0;

      if (Array.isArray(p?.variants) && p.variants.length > 0) {
        stock_total = p.variants.reduce((acc: number, v: any) => {
          if (v?.stock != null) return acc + toNumber(v.stock);
          if (v?.depth != null) return acc + toNumber(v.depth);
          if (v?.inventory?.depth != null) return acc + toNumber(v.inventory.depth);
          if (Array.isArray(v?.inventories)) {
            return acc + v.inventories.reduce((a: number, inv: any) => {
              if (inv?.depth != null) return a + toNumber(inv.depth);
              if (inv?.quantity != null) return a + toNumber(inv.quantity);
              return a;
            }, 0);
          }
          return acc;
        }, 0);
      } else if (p?.depth != null) {
        stock_total = toNumber(p.depth);
      } else if (p?.stock != null) {
        stock_total = toNumber(p.stock);
      }

      return { ...p, stock_total };
    });

    rawData.productos = productos;

    const totalUnits = productos.reduce((acc: number, pr: any) => acc + toNumber(pr.stock_total), 0);
    const productsWithStock = productos.filter((pr: any) => toNumber(pr.stock_total) > 0).length;
    const productsOutOfStock = productos.length - productsWithStock;

    rawData.stock_warehouse = {
      totalUnits,
      productsWithStock,
      productsOutOfStock,
      computed_at: new Date().toISOString(),
      since,
      per_page: PER_PAGE,
      pages: productos.length ? Math.ceil(productos.length / PER_PAGE) : 0,
    };
  } catch (e: any) {
    console.warn('Productos:', e?.response?.status || e?.message);
    rawData.productos = [];
    rawData.stock_warehouse = {
      totalUnits: 0,
      productsWithStock: 0,
      productsOutOfStock: 0,
      computed_at: new Date().toISOString(),
      since,
      per_page: PER_PAGE,
      pages: 0,
    };
  }

  // ---------- ORDERS ----------
  try {
    const ordersRaw = await fetchPaged('orders', MAX_PAGES_ORDERS);
    rawData.ventas = ordersRaw;
  } catch (e: any) {
    console.warn('Ventas:', e?.response?.status || e?.message);
    rawData.ventas = [];
  }

  // ---------- CUSTOMERS ----------
  try {
    const customersRaw = await fetchPaged('customers', MAX_PAGES_CUSTOMERS);
    rawData.clientes = customersRaw;
  } catch (e: any) {
    console.warn('Clientes:', e?.response?.status || e?.message);
    rawData.clientes = [];
  }

  // ---------- Persistencia en DB ----------
  const tn = await this.tiendaNubeRepo.findOne({ where: { storeId } });
  if (tn) {
    tn.rawData = rawData;
    await this.tiendaNubeRepo.save(tn);
  }

  // ---------- Subida a GCS (SOLO SNAPSHOT) ----------
  const gcsUrls: Record<string, string | null> = {
    snapshot: null,
  };

  try {
    const snapPath = buildSnapshotPath(tenant, 'tiendanube', 'snapshot', 'json');
    gcsUrls.snapshot = await this.gcs.uploadJson(snapPath, {
      fetched_at: new Date().toISOString(),
      storeId,
      since,
      per_page: PER_PAGE,
      ...rawData,
    });
    console.log('✅ [GCS] TiendaNube snapshot subido correctamente');
  } catch (e: any) {
    console.warn('[GCS] snapshot:', e?.message);
  }

  // ---------- Respuesta ----------
  const result = tn?.rawData ?? rawData;
  (result as any).__gcs = gcsUrls;
  return result;
}
  /**
   * Compara la última fecha de métrica guardada con el last_login y actualiza la diferencia en días (solo 1 vez por día)
   * Guarda el resultado en rawData
   */
  async getMetricsDiffLogin(userId: string): Promise<{ lastMetricDate: string | null, lastLogin: string | null, diffDays: number | null }> {
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

  async deleteByUserId(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['tiendaNube'] });
    if (!user) throw new BadRequestException('Usuario no encontrado');
    if (!user.tiendaNube) return { success: true };

    await this.tiendaNubeRepo.delete(user.tiendaNube.id);

    user.tiendaNube = null!;
    await this.userRepo.save(user);

    return { success: true };
  }

  async dumpOrdersToGcs(cliente: string, rawOrders: any[]) {
    const objectPath = buildObjectPath(cliente, 'tiendanube', 'orders', 'json');
    return this.gcs.uploadJson(objectPath, rawOrders);
  }
}