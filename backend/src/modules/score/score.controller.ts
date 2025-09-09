import { Controller, Post, Get, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { ScoreService } from './score.service';
import { SyncScoreDto } from './dto/sync-score.dto';

@ApiTags('score')
@ApiBearerAuth()
@Controller('score')
export class ScoreController {
  constructor(private readonly scoreService: ScoreService) {}

  /**
   * Sincroniza/actualiza el score de un usuario desde BigQuery
   */
  @Post('sync')
  @ApiOperation({ summary: 'Sincroniza/actualiza el score de un usuario desde BigQuery por email' })
  @ApiBody({ type: SyncScoreDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Score sincronizado exitosamente',
    schema: { 
      example: { 
        id: 'uuid-score', 
        email: 'usuario@email.com',
        value: 750, 
        details: { source: 'bigquery', syncedAt: '2024-01-01T00:00:00.000Z' },
        createdAt: '2024-01-01T00:00:00.000Z' 
      } 
    } 
  })
  async syncUserScore(@Body() syncScoreDto: SyncScoreDto) {
    return await this.scoreService.syncUserScore(syncScoreDto);
  }

  /**
   * Ejecuta la sincronización diaria de todos los emails en BigQuery
   */
  @Post('sync/daily')
  @ApiOperation({ summary: 'Ejecuta la sincronización diaria de scores para todos los emails en BigQuery' })
  @ApiResponse({ 
    status: 201, 
    description: 'Sincronización diaria completada',
    schema: { 
      example: { 
        synchronized: 150, 
        errors: 5 
      } 
    } 
  })
  async syncDailyScores() {
    return await this.scoreService.syncDailyScores();
  }

  /**
   * Obtiene el score más reciente de un usuario por email
   */
  @Get('email/:email/latest')
  @ApiOperation({ summary: 'Obtiene el score más reciente de un usuario por email' })
  @ApiParam({ name: 'email', type: String })
  @ApiResponse({ 
    status: 200, 
    description: 'Score más reciente del usuario',
    schema: { 
      example: { 
        id: 'uuid-score', 
        email: 'usuario@email.com',
        value: 750, 
        details: { source: 'bigquery' },
        createdAt: '2024-01-01T00:00:00.000Z' 
      } 
    } 
  })
  async getLatestScoreByEmail(@Param('email') email: string) {
    return await this.scoreService.getLatestScoreByEmail(email);
  }

  /**
   * Obtiene el score más reciente de un usuario por userId
   */
  @Get('user/:userId/latest')
  @ApiOperation({ summary: 'Obtiene el score más reciente de un usuario por userId' })
  @ApiParam({ name: 'userId', type: String })
  @ApiResponse({ 
    status: 200, 
    description: 'Score más reciente del usuario',
    schema: { 
      example: { 
        id: 'uuid-score', 
        email: 'usuario@email.com',
        value: 750, 
        details: { source: 'bigquery' },
        createdAt: '2024-01-01T00:00:00.000Z' 
      } 
    } 
  })
  async getLatestScoreByUserId(@Param('userId') userId: string) {
    return await this.scoreService.getLatestScoreByUserId(userId);
  }

  /**
   * Obtiene todos los scores de un usuario por email
   */
  @Get('email/:email')
  @ApiOperation({ summary: 'Obtiene todos los scores de un usuario por email' })
  @ApiParam({ name: 'email', type: String })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de scores del usuario',
    schema: { 
      example: [
        { id: 'uuid-score-1', email: 'usuario@email.com', value: 750, createdAt: '2024-01-01T00:00:00.000Z' },
        { id: 'uuid-score-2', email: 'usuario@email.com', value: 720, createdAt: '2023-12-01T00:00:00.000Z' }
      ] 
    } 
  })
  async getScoresByEmail(@Param('email') email: string) {
    return await this.scoreService.getScoresByEmail(email);
  }

  /**
   * Obtiene todos los scores de un usuario por userId
   */
  @Get('user/:userId')
  @ApiOperation({ summary: 'Obtiene todos los scores de un usuario por userId' })
  @ApiParam({ name: 'userId', type: String })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista de scores del usuario',
    schema: { 
      example: [
        { id: 'uuid-score-1', email: 'usuario@email.com', value: 750, createdAt: '2024-01-01T00:00:00.000Z' },
        { id: 'uuid-score-2', email: 'usuario@email.com', value: 720, createdAt: '2023-12-01T00:00:00.000Z' }
      ] 
    } 
  })
  async getScoresByUserId(@Param('userId') userId: string) {
    return await this.scoreService.getScoresByUserId(userId);
  }

  /**
   * Lista todos los scores con paginación
   */
  @Get()
  @ApiOperation({ summary: 'Lista todos los scores con paginación' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ 
    status: 200, 
    description: 'Lista paginada de scores',
    schema: { 
      example: {
        scores: [
          { id: 'uuid-score', userId: 'uuid-user', value: 750, createdAt: '2024-01-01T00:00:00.000Z' }
        ],
        total: 100
      } 
    } 
  })
  async getAllScores(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return await this.scoreService.getAllScores(page, limit);
  }

  /**
   * Obtiene un score por ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtiene un score por ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ 
    status: 200, 
    description: 'Score encontrado',
    schema: { 
      example: { 
        id: 'uuid-score', 
        email: 'usuario@email.com',
        value: 750, 
        details: { source: 'bigquery' },
        createdAt: '2024-01-01T00:00:00.000Z' 
      } 
    } 
  })
  async getScoreById(@Param('id') id: string) {
    return await this.scoreService.getScoreById(id);
  }
}
