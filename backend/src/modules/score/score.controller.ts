// ...existing code...
import { Controller, Post, Get, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

@ApiTags('score')
@ApiBearerAuth()
@Controller('score')
export class ScoreController {
  // Aquí irán los endpoints para scores

  /**
   * Crea un score para un usuario
   */
  @Post()
  @ApiOperation({ summary: 'Crea un score' })
  @ApiBody({ schema: { properties: { userId: { type: 'string', example: 'uuid-user' }, value: { type: 'number', example: 750 } } } })
  @ApiResponse({ status: 201, description: 'Score creado', schema: { example: { id: 'uuid-score', userId: 'uuid-user', value: 750, createdAt: '2024-01-01T00:00:00.000Z' } } })
  createScore() {}

  /**
   * Lista todos los scores
   */
  @Get()
  @ApiOperation({ summary: 'Lista todos los scores' })
  @ApiResponse({ status: 200, description: 'Lista de scores', schema: { example: [ { id: 'uuid-score', userId: 'uuid-user', value: 750, createdAt: '2024-01-01T00:00:00.000Z' } ] } })
  getAllScores() {}

  /**
   * Obtiene un score por ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtiene un score por ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Score encontrado', schema: { example: { id: 'uuid-score', userId: 'uuid-user', value: 750, createdAt: '2024-01-01T00:00:00.000Z' } } })
  getScoreById() {}

  /**
   * Elimina un score
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Elimina un score' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Score eliminado', schema: { example: { success: true } } })
  deleteScore() {}
}
