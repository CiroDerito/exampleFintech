import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { User } from '../users/entities/user.entity';
import { MetaAdsService } from '../meta-ads/meta-ads.service';
import { TiendaNubeService } from '../tienda-nube/tienda-nube.service';
import { GaAnalyticsService } from '../google-analytics/google-analytics.service';
import { GoogleMerchantService } from '../google-merchant/google-merchant.service';
import { BcraService } from '../bcra/bcra.service';

@Injectable()
export class DailyUpdatesService {
  private readonly logger = new Logger(DailyUpdatesService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly metaAdsService: MetaAdsService,
    private readonly tiendaNubeService: TiendaNubeService,
    private readonly gaAnalyticsService: GaAnalyticsService,
    private readonly googleMerchantService: GoogleMerchantService,
    private readonly bcraService: BcraService,
  ) {}

  /**
   * Cron job que se ejecuta todos los días a las 10:00 AM (hora del servidor)
   * Expresión cron: '0 10 * * *' significa: minuto 0, hora 10, todos los días del mes, todos los meses, todos los días de la semana
   */
  @Cron('0 10 * * *', {
    name: 'daily-data-update',
    timeZone: 'America/Argentina/Buenos_Aires', // Ajusta según tu zona horaria
  })
  async scheduledDailyUpdate(): Promise<void> {
    this.logger.log('⏰ Ejecutando actualización diaria automática programada para las 10:00 AM');
    try {
      const result = await this.runDailyUpdates();
      this.logger.log('✅ Actualización diaria automática completada exitosamente', result);
    } catch (error) {
      this.logger.error('❌ Error en la actualización diaria automática:', error.message);
    }
  }

  /**
   * Ejecuta la actualización diaria de todos los módulos de datos
   */
  async runDailyUpdates(): Promise<{
    total: number;
    updated: {
      metaAds: number;
      tiendaNube: number;
      googleAnalytics: number;
      googleMerchant: number;
      bcra: number;
    };
    errors: {
      metaAds: number;
      tiendaNube: number;
      googleAnalytics: number;
      googleMerchant: number;
      bcra: number;
    };
  }> {
    this.logger.log('🚀 Iniciando actualización diaria de datos de usuarios');

    const users = await this.userRepo.find({
      where: { isActive: true },
      relations: ['metaAds', 'tiendaNube', 'gaAnalytics', 'googleMerchant', 'bcra'],
    });

    const stats = {
      total: users.length,
      updated: { metaAds: 0, tiendaNube: 0, googleAnalytics: 0, googleMerchant: 0, bcra: 0 },
      errors: { metaAds: 0, tiendaNube: 0, googleAnalytics: 0, googleMerchant: 0, bcra: 0 },
    };

    for (const user of users) {
      this.logger.log(`📊 Actualizando datos para usuario: ${user.email}`);

      // Meta Ads
      if (user.metaAds?.data?.access_token) {
        try {
          await this.updateMetaAdsData(user.id);
          stats.updated.metaAds++;
          this.logger.log(`✅ Meta Ads actualizado para ${user.email}`);
        } catch (error) {
          stats.errors.metaAds++;
          this.logger.error(`❌ Error actualizando Meta Ads para ${user.email}:`, error.message);
        }
      }

      // Tienda Nube
      if (user.tiendaNube?.data?.access_token) {
        try {
          await this.updateTiendaNubeData(user.id);
          stats.updated.tiendaNube++;
          this.logger.log(`✅ Tienda Nube actualizado para ${user.email}`);
        } catch (error) {
          stats.errors.tiendaNube++;
          this.logger.error(`❌ Error actualizando Tienda Nube para ${user.email}:`, error.message);
        }
      }

      // Google Analytics
      if (user.gaAnalytics?.data?.tokens?.access_token) {
        try {
          await this.updateGoogleAnalyticsData(user.id);
          stats.updated.googleAnalytics++;
          this.logger.log(`✅ Google Analytics actualizado para ${user.email}`);
        } catch (error) {
          stats.errors.googleAnalytics++;
          this.logger.error(`❌ Error actualizando Google Analytics para ${user.email}:`, error.message);
        }
      }

      // Google Merchant
      if (user.googleMerchant?.tokens?.access_token) {
        try {
          await this.updateGoogleMerchantData(user.id);
          stats.updated.googleMerchant++;
          this.logger.log(`✅ Google Merchant actualizado para ${user.email}`);
        } catch (error) {
          stats.errors.googleMerchant++;
          this.logger.error(`❌ Error actualizando Google Merchant para ${user.email}:`, error.message);
        }
      }

      // BCRA
      if (user.bcra && user.dni) {
        try {
          await this.updateBcraData(user.id);
          stats.updated.bcra++;
          this.logger.log(`✅ BCRA actualizado para ${user.email}`);
        } catch (error) {
          stats.errors.bcra++;
          this.logger.error(`❌ Error actualizando BCRA para ${user.email}:`, error.message);
        }
      }

      // Pausa pequeña entre usuarios para no saturar APIs
      await this.sleep(1000);
    }

    this.logger.log('🎉 Actualización diaria completada', stats);
    return stats;
  }

  /**
   * Actualiza datos de Meta Ads para un usuario usando su token guardado
   */
  private async updateMetaAdsData(userId: string): Promise<void> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['metaAds'],
    });

    if (!user?.metaAds?.accountId || !user.metaAds?.data?.access_token) {
      throw new Error('Meta Ads no configurado completamente');
    }

    // Usar el método existente del service para obtener insights
    await this.metaAdsService.fetchInsightsForUserAndSave(
      userId,
      user.metaAds.accountId,
      user.metaAds.data.access_token
    );
  }

  /**
   * Actualiza datos de Tienda Nube para un usuario usando su token guardado
   */
  private async updateTiendaNubeData(userId: string): Promise<void> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['tiendaNube'],
    });

    if (!user?.tiendaNube?.storeId || !user.tiendaNube?.data?.access_token) {
      throw new Error('Tienda Nube no configurado completamente');
    }

    // Usar el método existente del service para actualizar datos
    await this.tiendaNubeService.fetchAndSaveRawData(
      user.tiendaNube.storeId,
      user.tiendaNube.data.access_token,
      user.email
    );
  }

  /**
   * Actualiza datos de Google Analytics para un usuario usando su token guardado
   */
  private async updateGoogleAnalyticsData(userId: string): Promise<void> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['gaAnalytics'],
    });

    if (!user?.gaAnalytics?.data?.tokens?.access_token || !user.gaAnalytics?.data?.propertyId) {
      throw new Error('Google Analytics no configurado completamente');
    }

    // Usar el método existente del service para actualizar métricas
    await this.gaAnalyticsService.fetchAndSaveMetrics(
      userId,
      user.gaAnalytics.data.propertyId
    );
  }

  /**
   * Actualiza datos de Google Merchant para un usuario usando su token guardado
   */
  private async updateGoogleMerchantData(userId: string): Promise<void> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['googleMerchant'],
    });

    if (!user?.googleMerchant?.tokens?.access_token || !user.googleMerchant?.data?.merchantId) {
      throw new Error('Google Merchant no configurado completamente');
    }

    // Usar el método existente del service para actualizar métricas
    await this.googleMerchantService.fetchAndSaveMetrics(
      userId,
      user.googleMerchant.data.merchantId
    );
  }

  /**
   * Actualiza datos de BCRA para un usuario usando su DNI
   */
  private async updateBcraData(userId: string): Promise<void> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['bcra'],
    });

    if (!user?.dni) {
      throw new Error('Usuario sin DNI configurado');
    }

    // Usar el método existente del service para consultar BCRA
    await this.bcraService.consultarDeudores(userId, user.dni.toString());
  }

  /**
   * Actualiza un módulo específico para todos los usuarios
   */
  async updateSpecificModule(module: 'metaAds' | 'tiendaNube' | 'googleAnalytics' | 'googleMerchant' | 'bcra'): Promise<{
    updated: number;
    errors: number;
  }> {
    this.logger.log(`🔄 Actualizando módulo específico: ${module}`);

    const users = await this.userRepo.find({
      where: { isActive: true },
      relations: [module === 'metaAds' ? 'metaAds' : 
                 module === 'tiendaNube' ? 'tiendaNube' :
                 module === 'googleAnalytics' ? 'gaAnalytics' :
                 module === 'googleMerchant' ? 'googleMerchant' : 'bcra'],
    });

    let updated = 0;
    let errors = 0;

    for (const user of users) {
      try {
        switch (module) {
          case 'metaAds':
            if (user.metaAds?.data?.access_token) {
              await this.updateMetaAdsData(user.id);
              updated++;
            }
            break;
          case 'tiendaNube':
            if (user.tiendaNube?.data?.access_token) {
              await this.updateTiendaNubeData(user.id);
              updated++;
            }
            break;
          case 'googleAnalytics':
            if (user.gaAnalytics?.data?.tokens?.access_token) {
              await this.updateGoogleAnalyticsData(user.id);
              updated++;
            }
            break;
          case 'googleMerchant':
            if (user.googleMerchant?.tokens?.access_token) {
              await this.updateGoogleMerchantData(user.id);
              updated++;
            }
            break;
          case 'bcra':
            if (user.bcra && user.dni) {
              await this.updateBcraData(user.id);
              updated++;
            }
            break;
        }
        await this.sleep(500);
      } catch (error) {
        errors++;
        this.logger.error(`❌ Error actualizando ${module} para ${user.email}:`, error.message);
      }
    }

    this.logger.log(`✅ Actualización de ${module} completada: ${updated} actualizados, ${errors} errores`);
    return { updated, errors };
  }

  /**
   * Pausa helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
