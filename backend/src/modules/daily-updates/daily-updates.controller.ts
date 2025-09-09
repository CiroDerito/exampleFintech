import { Controller, Post, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { DailyUpdatesService } from './daily-updates.service';

@ApiTags('daily-updates')
@ApiBearerAuth()
@Controller('daily-updates')
export class DailyUpdatesController {
  constructor(private readonly dailyUpdatesService: DailyUpdatesService) {}

  /**
   * Ejecuta la actualización diaria completa de todos los módulos
   */
  @Post('run-all')
  @ApiOperation({ summary: 'Ejecuta la actualización diaria de todos los módulos de datos' })
  @ApiResponse({ 
    status: 201, 
    description: 'Actualización diaria ejecutada exitosamente',
    schema: { 
      example: {
        total: 150,
        updated: {
          metaAds: 45,
          tiendaNube: 30,
          googleAnalytics: 40,
          bcra: 35
        },
        errors: {
          metaAds: 2,
          tiendaNube: 1,
          googleAnalytics: 0,
          bcra: 3
        }
      }
    } 
  })
  async runDailyUpdates() {
    try {
      const result = await this.dailyUpdatesService.runDailyUpdates();
      return {
        success: true,
        message: 'Daily update executed successfully',
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: 'Error executing daily update',
        error: error.message
      };
    }
  }

  /**
   * Actualiza un módulo específico para todos los usuarios
   */
  @Post('module/:module')
  @ApiOperation({ summary: 'Actualiza un módulo específico para todos los usuarios' })
  @ApiParam({ 
    name: 'module', 
    enum: ['metaAds', 'tiendaNube', 'googleAnalytics', 'bcra'],
    description: 'Nombre del módulo a actualizar'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Módulo actualizado exitosamente',
    schema: { 
      example: {
        updated: 45,
        errors: 2
      }
    } 
  })
  async updateSpecificModule(
    @Param('module') module: 'metaAds' | 'tiendaNube' | 'googleAnalytics' | 'bcra'
  ) {
    return await this.dailyUpdatesService.updateSpecificModule(module);
  }
}
