// Controlador para exponer endpoints de IntegrationData
// Permite crear, listar, obtener, actualizar y eliminar datos de integraciones externas

import { Controller, Post, Body, Get, Param, Query, Patch, Delete } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { IntegrationDataService } from './integration-data.service';
import { CreateIntegrationDataDto } from './dto/create-integration-data.dto';
import { UpdateIntegrationDataDto } from './dto/update-integration-data.dto';
import { IntegrationSource } from './entities/integration-data.entity';

@ApiTags('integration-data')
@ApiBearerAuth()
@Controller('integration-data')
export class IntegrationDataController {
  constructor(private readonly integrationDataService: IntegrationDataService) {}

  // Crear un nuevo registro

  @Post()
  @ApiOperation({ summary: 'Crea datos de integración' })
  @ApiBody({ type: CreateIntegrationDataDto, examples: { default: { value: { userId: 'uuid-user', provider: 'Plaid', data: { account: '1234', balance: 5000 } } } } })
  @ApiResponse({ status: 201, description: 'Datos de integración creados', schema: { example: { id: 'uuid-integration', userId: 'uuid-user', provider: 'Plaid', data: { account: '1234', balance: 5000 }, createdAt: '2024-01-01T00:00:00.000Z' } } })
  create(@Body() dto: CreateIntegrationDataDto) {
    return this.integrationDataService.create(dto);
  }

  // Listar todos los registros, con filtros opcionales

  @Get()
  @ApiOperation({ summary: 'Lista datos de integración (con filtros opcionales)' })
  @ApiQuery({ name: 'source', required: false })
  @ApiResponse({ status: 200, description: 'Lista de datos de integración', schema: { example: [ { id: 'uuid-integration', userId: 'uuid-user', provider: 'Plaid', data: { account: '1234', balance: 5000 }, createdAt: '2024-01-01T00:00:00.000Z' } ] } })
  findAll(
    @Query('userId') userId?: string,
    @Query('source') source?: IntegrationSource,
  ) {
    return this.integrationDataService.findAll(userId, source);
  }

  // Obtener un registro por ID

  @Get(':id')
  @ApiOperation({ summary: 'Obtiene datos de integración por ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Datos de integración encontrados', schema: { example: { id: 'uuid-integration', userId: 'uuid-user', provider: 'Plaid', data: { account: '1234', balance: 5000 }, createdAt: '2024-01-01T00:00:00.000Z' } } })
  findOne(@Param('id') id: string) {
    return this.integrationDataService.findOne(id);
  }

  // Actualizar un registro

  @Patch(':id')
  @ApiOperation({ summary: 'Actualiza datos de integración' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateIntegrationDataDto, examples: { default: { value: { provider: 'Plaid', data: { account: '5678', balance: 7000 } } } } })
  @ApiResponse({ status: 200, description: 'Datos de integración actualizados', schema: { example: { id: 'uuid-integration', provider: 'Plaid', data: { account: '5678', balance: 7000 }, updatedAt: '2024-01-02T00:00:00.000Z' } } })
  update(@Param('id') id: string, @Body() dto: UpdateIntegrationDataDto) {
    return this.integrationDataService.update(id, dto);
  }

  // Eliminar un registro

  @Delete(':id')
  @ApiOperation({ summary: 'Elimina datos de integración' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Datos de integración eliminados', schema: { example: { success: true } } })
  remove(@Param('id') id: string) {
    return this.integrationDataService.remove(id);
  }
}
