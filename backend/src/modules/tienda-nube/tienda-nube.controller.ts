 
import type { Response } from 'express';
import * as crypto from 'crypto';
import {
  Controller, Get, Query, Res, BadRequestException,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TiendaNubeService } from './tienda-nube.service';

@ApiTags('tiendanube')
@Controller('tiendanube')
export class TiendaNubeController {
  constructor(private readonly tn: TiendaNubeService) {}

  @ApiOperation({ summary: 'Redirige a la autorización de TiendaNube' })
  @Get('install')
  async install(@Res() res: Response) {
    const CLIENT_ID = process.env.TIENDANUBE_CLIENT_ID;
    const REDIRECT_URI = process.env.TIENDANUBE_REDIRECT_URI;
    if (!CLIENT_ID || !REDIRECT_URI) {
      throw new BadRequestException('TIENDANUBE_CLIENT_ID o TIENDANUBE_REDIRECT_URI faltantes');
    }

    const state = crypto.randomBytes(16).toString('hex');
    // TODO: guardá `state` en sesión/DB para validarlo en /callback
    const scope = [
      'read_orders','write_orders',
      'read_products','write_products',
      'read_customers','write_customers',
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

    // Intercambio code -> token
    const token = await this.tn.exchangeCodeForToken({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code,
      redirect_uri: REDIRECT_URI,
    });

    // Guardar conexión
    await this.tn.saveConnection({
      storeId: String(token.user_id),
      accessToken: token.access_token,
      scope: token.scope,
      userId,
    });

    // (Opcional) Traer data inicial (no bloqueante)
    try {
      await this.tn.fetchAndSaveRawData(String(token.user_id), token.access_token);
    } catch (e) {
      // log suave
      console.warn('fetchAndSaveRawData error:', e?.response?.status || e?.message);
    }

    return res.redirect(FRONT_SUCCESS_URL);
  }

  // -------- Endpoints de datos (proxy simple) --------

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

}
