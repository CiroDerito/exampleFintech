import type { Response } from 'express';
import * as crypto from 'crypto';
import {
  Controller, Get, Query, Res, BadRequestException,
  Param, Delete, Body, Post,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TiendaNubeService } from './tienda-nube.service';
import { UsersService } from '../users/users.service';
import { GcsService } from 'src/gcs/gcs.service';
import { emailToTenant } from 'src/gcs/tenant.util';

@ApiTags('tiendanube')
@Controller('tiendanube')
export class TiendaNubeController {
  constructor(
    private readonly tn: TiendaNubeService,
    private readonly users: UsersService,   
    private readonly gcs: GcsService,       
  ) { }

  @ApiOperation({ summary: 'Redirige a la autorización de TiendaNube' })
  @Get('install')
  async install(@Res() res: Response) {
    const CLIENT_ID = process.env.TIENDANUBE_CLIENT_ID;
    const REDIRECT_URI = process.env.TIENDANUBE_REDIRECT_URI;
    if (!CLIENT_ID || !REDIRECT_URI) {
      throw new BadRequestException('TIENDANUBE_CLIENT_ID o TIENDANUBE_REDIRECT_URI faltantes');
    }
    const state = crypto.randomBytes(16).toString('hex');
    const scope = [
      'read_orders', 'write_orders',
      'read_products', 'write_products',
      'read_customers', 'write_customers',
    ].join(',');
    const url =
      `https://www.tiendanube.com/apps/authorize` +
      `?client_id=${CLIENT_ID}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&scope=${scope}` +
      `&state=${state}`;
    return res.redirect(url);
  }

  @ApiOperation({ summary: 'Callback OAuth de TiendaNube' })
  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('userId') userId: string,      
    @Res() res: Response,
  ) {
    const CLIENT_ID = process.env.TIENDANUBE_CLIENT_ID;
    const CLIENT_SECRET = process.env.TIENDANUBE_CLIENT_SECRET;
    const REDIRECT_URI = process.env.TIENDANUBE_REDIRECT_URI;
    const FRONT_SUCCESS_URL = process.env.FRONT_SUCCESS_URL || 'http://localhost:3000/fuentes-datos';

    if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI) {
      throw new BadRequestException('Variables de entorno de TiendaNube faltantes');
    }

    const token = await this.tn.exchangeCodeForToken({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      redirect_uri: REDIRECT_URI,
    });
    const storeId = String(token.user_id);

    await this.tn.saveConnection({
      storeId,
      accessToken: token.access_token,
      scope: token.scope,
      userId,
    });

    let tenantEmail: string | undefined;
    try {
      const u = await this.users.findById(userId);   
      tenantEmail = u?.email;
    } catch {}

    try {
      const tenant = emailToTenant(tenantEmail, storeId);
      await this.gcs.ensureTenantPrefix(tenant, 'tiendanube');
    } catch (e: any) {
      console.warn('[GCS ensureTenantPrefix] warn:', e?.message);
    }
    this.tn
      .fetchAndSaveRawData(storeId, token.access_token, tenantEmail) // el service prioriza email sobre storeId
      .then(() => {
        console.log(`✅ Snapshot automático TiendaNube completado para usuario ${userId}`);
      })
      .catch(e => {
        console.error(`❌ Error en snapshot automático TiendaNube para usuario ${userId}:`, e?.response?.status || e?.message);
      });

    return res.redirect(FRONT_SUCCESS_URL);
  }

  // ------- (resto tal cual) -------

  @ApiOperation({ summary: 'Listar productos' })
  @ApiQuery({ name: 'store_id', required: true })
  @Get('products')
  async products(@Query('store_id') storeId: string, @Query() q: any) {
    return this.tn.getProducts(storeId, q);
  }

  @ApiOperation({ summary: 'Listar órdenes (ventas)' })
  @ApiQuery({ name: 'store_id', required: true })
  @Get('orders')
  async orders(@Query('store_id') storeId: string, @Query() q: any) {
    return this.tn.getOrders(storeId, q);
  }

  @ApiOperation({ summary: 'Listar clientes' })
  @ApiQuery({ name: 'store_id', required: true })
  @Get('customers')
  async customers(@Query('store_id') storeId: string, @Query() q: any) {
    return this.tn.getCustomers(storeId, q);
  }

  @ApiOperation({ summary: 'Trae la data por id de usuario interno' })
  @Get('raw-by-user')
  async rawByUser(@Query('user_id') userId: string) {
    return this.tn.getRawDataByUserId(userId);
  }

  @ApiOperation({ summary: 'Trae la data por id de usuario interno (por path param)' })
  @Get('by-user/:id')
  async byUser(@Param('id') userId: string) {
    return this.tn.getRawDataByUserId(userId);
  }

  @Get(':userId/metrics-diff-login')
  async getMetricsDiffLogin(@Param('userId') userId: string) {
    return this.tn.getMetricsDiffLogin(userId);
  }

  @Delete(':userId')
  @ApiOperation({ summary: 'Elimina los datos BCRA por userId' })
  async deleteByUserId(@Param('userId') userId: string) {
    return this.tn.deleteByUserId(userId);
  }
}
