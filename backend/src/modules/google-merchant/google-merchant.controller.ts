import { Controller, Get, Post, Body, Param, Query, Res, Delete } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import type { Response } from 'express';
import { GoogleMerchantService } from './google-merchant.service';

@Controller('merchant')
export class GoogleMerchantController {
    constructor(private readonly merchant: GoogleMerchantService) { }

    @Get('oauth/install')
    async install(@Query('userId') userId: string, @Res() res: Response) {
        const state = jwt.sign({ userId, ts: Date.now() }, process.env.JWT_SECRET!, { expiresIn: '10m' });
        const url = this.merchant.getAuthUrl(state);
        console.log('MERCHANT AUTH URL =>', url); 
        return res.redirect(url);
    }

    @Get('oauth/callback')
    async callback(@Query('code') code: string, @Query('state') state: string, @Res() res: Response) {
        const { userId } = (await import('jsonwebtoken')).default.verify(state, process.env.JWT_SECRET!) as any;
        await this.merchant.exchangeCode(userId, code);

        // Redirigir al wizard, no a fuentes-datos directamente
        const frontend = process.env.FRONTEND_URL_MERCHANT || 'http://localhost:3002/fuentes-datos/merchant-callback';
        return res.redirect(`${frontend}?merchant_connected=1`);
    }

    @Post(':userId/account/link')
    async linkAccount(@Param('userId') userId: string, @Body() body: { merchantId: string }) {
        console.log(`[MERCHANT-CONTROLLER] 🔗 Recibida solicitud de vinculación`);
        console.log(`[MERCHANT-CONTROLLER] userId:`, userId);
        console.log(`[MERCHANT-CONTROLLER] body completo:`, body);
        console.log(`[MERCHANT-CONTROLLER] body.merchantId:`, body.merchantId);
        console.log(`[MERCHANT-CONTROLLER] Todas las keys del body:`, Object.keys(body));
        
        if (!body.merchantId) {
            console.error(`[MERCHANT-CONTROLLER] ❌ BODY NO CONTIENE MERCHANTID`);
            return {
                success: false,
                error: 'merchantId es requerido',
                receivedBody: body
            };
        }
        
        try {
            const result = await this.merchant.linkMerchantAccount(userId, body.merchantId);
            console.log(`[MERCHANT-CONTROLLER] ✅ Vinculación completada exitosamente para usuario ${userId}`);
            return result;
        } catch (error) {
            console.error(`[MERCHANT-CONTROLLER] ❌ Error en vinculación para usuario ${userId}:`, error.message);
            throw error;
        }
    }

    @Post(':userId/snapshot')
    async snapshot(
        @Param('userId') userId: string,
        @Body() body: {
            merchantId?: string;
            startDate?: string;
            endDate?: string;
        },
    ) {
        return this.merchant.fetchMetrics(userId, body);
    }

    /**
     * Endpoint para test manual del flujo completo de métricas
     */
    @Post(':userId/test-metrics')
    async testMetrics(@Param('userId') userId: string) {
        try {
            console.log(`[MERCHANT-CONTROLLER] 🧪 Iniciando test de métricas para usuario ${userId}`);
            const result = await this.merchant.fetchAndSaveMetrics(userId);
            return {
                success: true,
                message: 'Métricas extraídas y guardadas exitosamente',
                data: {
                    fetched_at: result.fetched_at,
                    merchantId: result.merchantId,
                    summary: result.summary,
                    metricsKeys: result.metrics ? Object.keys(result.metrics) : []
                }
            };
        } catch (error) {
            console.error(`[MERCHANT-CONTROLLER] ❌ Error en test de métricas:`, error.message);
            return {
                success: false,
                error: error.message,
                details: error.stack
            };
        }
    }

    /**
     * Endpoint de debug para verificar estado del usuario
     */
    @Get(':userId/debug')
    async debugUser(@Param('userId') userId: string) {
        try {
            const user = await this.merchant.getMerchantStatus(userId);
            return {
                success: true,
                debug: user
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Endpoint para forzar extracción de métricas después de vincular cuenta
     */
    @Post(':userId/force-extract-metrics')
    async forceExtractMetrics(@Param('userId') userId: string) {
        try {
            console.log(`[MERCHANT-CONTROLLER] 🔧 Forzando extracción de métricas para usuario ${userId}`);
            
            // Obtener el merchantId desde la BD
            const status = await this.merchant.getMerchantStatus(userId);
            if (!status.merchantId) {
                return {
                    success: false,
                    error: 'No hay cuenta de Merchant vinculada'
                };
            }

            console.log(`[MERCHANT-CONTROLLER] Cuenta encontrada: ${status.merchantId}, iniciando extracción...`);
            const result = await this.merchant.fetchMetrics(userId, { merchantId: status.merchantId });
            
            return {
                success: true,
                message: 'Métricas extraídas exitosamente',
                data: {
                    merchantId: status.merchantId,
                    fetched_at: result.fetched_at,
                    summary: result.summary,
                    hasMetrics: !!result.metrics
                }
            };
        } catch (error) {
            console.error(`[MERCHANT-CONTROLLER] ❌ Error forzando extracción:`, error.message);
            return {
                success: false,
                error: error.message,
                stack: error.stack
            };
        }
    }

    /**
     * Lista las cuentas de Merchant Center disponibles para el usuario
     */
    @Get(':userId/accounts')
    async listAccounts(@Param('userId') userId: string) {
        try {
            console.log(`[MERCHANT-CONTROLLER] Listing accounts for user: ${userId}`);
            const accounts = await this.merchant.listMerchantAccounts(userId);
            console.log(`[MERCHANT-CONTROLLER] Found ${accounts.length} accounts`);
            return accounts;
        } catch (error: any) {
            console.error('[MERCHANT-CONTROLLER] Error listing accounts:', error.message);
            throw error;
        }
    }

    /**
     * Obtiene el estado actual de la cuenta vinculada y métricas
     */
    @Get(':userId/status')
    async getStatus(@Param('userId') userId: string) {
        try {
            return await this.merchant.getMerchantStatus(userId);
        } catch (error: any) {
            console.error('[MERCHANT-CONTROLLER] Error getting status:', error.message);
            throw error;
        }
    }

    @Delete(':userId')
    async deleteUserData(@Param('userId') userId: string) {
        return this.merchant.deleteUserData(userId);
    }
}
