import { Controller, Get, Post, Body, Param, Query, Res, Delete } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import type { Response } from 'express';
import { GaAnalyticsService } from './google-analytics.service';

@Controller('ga')
export class GaAnalyticsController {
    constructor(private readonly ga: GaAnalyticsService) { }

    @Get('oauth/install')
    async install(@Query('userId') userId: string, @Res() res: Response) {
        const state = jwt.sign({ userId, ts: Date.now() }, process.env.JWT_SECRET!, { expiresIn: '10m' });
        const url = this.ga.getAuthUrl(state);
        console.log('GA AUTH URL =>', url); 
        return res.redirect(url);
    }

    @Get('oauth/callback')
    async callback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
    const { userId } = (await import('jsonwebtoken')).default.verify(state, process.env.JWT_SECRET!) as any;
    await this.ga.exchangeCode(userId, code);

    const frontend = process.env.FRONTEND_URL_GA || '/';
    return res.redirect(`${frontend}?ga_connected=1`);
    }

    @Post(':userId/property/link')
    async linkProperty(@Param('userId') userId: string, @Body() body: { propertyId: string }) {
        return this.ga.linkProperty(userId, body.propertyId);
    } 

@Post(':userId/snapshot')
async snapshot(
  @Param('userId') userId: string,
  @Body() body: {
    propertyId?: string;
    startDate?: string; 
    endDate?: string;   
    metrics?: string[];
  },
) {
  return this.ga.fetchMetrics(userId, body);
}
     /**
   * Lista las propiedades GA4 disponibles para el usuario
   */
  @Get(':userId/properties')
  async listProperties(@Param('userId') userId: string) {
    return this.ga.listUserGaProperties(userId);
  }

  @Delete(':userId')
  async deleteUserData(@Param('userId') userId: string) {
    return this.ga.deleteUserData(userId);
  }
}
