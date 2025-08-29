import { Controller, Post, Body, Param, Get, Query, Res, NotFoundException, Delete } from '@nestjs/common';
import { MetaAdsService } from './meta-ads.service';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import * as jwt from 'jsonwebtoken';
import type { Response } from 'express';

@ApiTags('Meta Ads')
@Controller('meta-ads')
export class MetaAdsController {
  constructor(private readonly metaAdsService: MetaAdsService) { }

  /**
   * Callback OAuth Meta Ads: intercambia code por access_token
   * Recibe el parámetro 'code' de Meta y devuelve el access_token
   */
  @Get('oauth/callback')
  async metaOAuthCallback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    const { userId } = (await import('jsonwebtoken')).default.verify(state, process.env.JWT_SECRET!) as any;

    const short = await this.metaAdsService.exchangeCodeForShortLivedToken(code);
    const long = await this.metaAdsService.exchangeShortForLongLived(short.access_token);

    // guardar token (sin accountId todavía)
    await this.metaAdsService.saveMetaAdsData(userId, null, {
      access_token: long.access_token,
      obtained_at: new Date().toISOString(),
      expires_in: long.expires_in,
      scopes: (process.env.META_SCOPES || 'ads_read').split(','),
    }, null);

    // redirigí al wizard para que el usuario elija la ad account
    const frontend = process.env.FRONTEND_URL_META;
    return res.redirect(`${frontend}?meta_connected=1`);
  }

  /**
   * Vincula la cuenta de Meta Ads y guarda los datos básicos
   */
  @Post(':userId')
  @ApiOperation({ summary: 'Vincula Meta Ads a un usuario y guarda datos básicos' })
  async saveMetaAds(
    @Param('userId') userId: string,
    @Body() body: { accountId: string; data: any; processData: any }
  ) {
    return this.metaAdsService.saveMetaAdsData(userId, body.accountId, body.data, body.processData);
  }

  /**
   * Obtiene métricas de campañas de Meta Ads para el usuario vinculado
   * @param userId UUID del usuario
   * @param month Mes a consultar (opcional, por defecto: 'last_month')
   * @returns Array de métricas: Month, cost, impressions, link clicks, CTR
   */
  @Get(':userId/campaign-metrics')
  @ApiOperation({ summary: 'Obtiene métricas de campañas de Meta Ads para el usuario vinculado' })
  @ApiQuery({ name: 'month', required: false, description: 'Mes a consultar (ej: last_month, this_month, etc)' })
  @ApiResponse({ status: 200, description: 'Array de métricas de campañas' })
  async getCampaignMetrics(
    @Param('userId') userId: string,
    @Query('month') month?: string
  ) {
    // Traer métricas del último año
    return this.metaAdsService.getCampaignInsights(userId, '', { month: 'last_year' });
  }

  //redirigir a facebook para login
  @Get('oauth/install')
  async install(@Query('userId') userId: string, @Res() res: Response) {
    const apiVersion = process.env.META_API_VERSION || 'v23.0';
    const state = jwt.sign({ userId, ts: Date.now() }, process.env.JWT_SECRET!, { expiresIn: '10m' });

    const params = new URLSearchParams({
      client_id: process.env.META_CLIENT_ID!,
      redirect_uri: process.env.META_REDIRECT_URI!, // debe coincidir 1:1 con el dashboard (en prod)
      response_type: 'code',
      scope: process.env.META_SCOPES || 'ads_read',
      state,
    });

    return res.redirect(`https://www.facebook.com/${apiVersion}/dialog/oauth?${params.toString()}`);
  }
  // listar ad acount
  @Get(':userId/adaccounts')
  async getAccounts(@Param('userId') userId: string) {
    return this.metaAdsService.listUserAdAccountsForUser(userId);
  }
  // elegir un ad acount
  @Post(':userId/adaccounts/link')
  async linkAccount(
    @Param('userId') userId: string,
    @Body() body: { accountId: string }
  ) {
    return this.metaAdsService.linkAdAccount(userId, body.accountId);
  }

  @Get(':userId/adaccounts/:accountId/campaigns')
  async listCampaigns(
    @Param('userId') userId: string,
    @Param('accountId') accountId: string
  ) {
    return this.metaAdsService.listCampaignsForAccount(userId, accountId);
  }

  @Post(':userId/campaign-metrics')
  async getAndSaveMetricsPost(
    @Param('userId') userId: string,
    @Body() body: { accountId: string; campaignId?: string; month?: string }
  ) {
    return this.metaAdsService.getCampaignInsights(userId, body.accountId, {
      month: body.month,
      campaignId: body.campaignId,
    });
  }


  /**
   * Obtiene métricas de campañas de Meta Ads desde el último login del usuario
   * @param userId UUID del usuario
   * @returns Array de métricas desde la fecha de último login
   */
  @Get(':userId/metrics-since-login')
  async getMetricsSinceLogin(@Param('userId') userId: string) {
    // Usar método público del servicio para obtener el usuario
    const user = await this.metaAdsService.getUserById(userId);
    const lastLogin = user?.last_login || user?.updatedAt;
    if (!lastLogin) throw new NotFoundException('No se encontró la fecha de último login');
    // Formatear fecha a YYYY-MM-DD
    const since = new Date(lastLogin).toISOString().slice(0, 10);
    // Solo pasar propiedades válidas al objeto de insights
    return this.metaAdsService.getCampaignInsights(userId, '', { month: undefined });
    // Si necesitas filtrar por fecha, ajusta la lógica en el servicio
  }

  /**
   * Compara la última fecha de métrica guardada con el last_login y devuelve la diferencia en días
   */
  @Get(':userId/metrics-diff-login')
  async getMetricsDiffLogin(@Param('userId') userId: string) {
    return this.metaAdsService.getMetricsDiffLogin(userId);
  }

  /**
   * Borrar datos de campañas de Meta Ads por usuario
   */
  @Delete(':userId')
  async deleteUserCampaigns(@Param('userId') userId: string) {
    return this.metaAdsService.deleteUserCampaigns(userId);
  }
}
