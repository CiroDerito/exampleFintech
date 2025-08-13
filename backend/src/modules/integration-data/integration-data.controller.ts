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
  @ApiBody({ type: CreateIntegrationDataDto })
  @ApiResponse({ status: 201, description: 'Datos de integración creados' })
  create(@Body() dto: CreateIntegrationDataDto) {
    return this.integrationDataService.create(dto);
  }

  // Listar todos los registros, con filtros opcionales

  @Get()
  @ApiOperation({ summary: 'Lista datos de integración (con filtros opcionales)' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'source', required: false })
  @ApiResponse({ status: 200, description: 'Lista de datos de integración' })
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
  @ApiResponse({ status: 200, description: 'Datos de integración encontrados' })
  findOne(@Param('id') id: string) {
    return this.integrationDataService.findOne(id);
  }

  // Actualizar un registro

  @Patch(':id')
  @ApiOperation({ summary: 'Actualiza datos de integración' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateIntegrationDataDto })
  @ApiResponse({ status: 200, description: 'Datos de integración actualizados' })
  update(@Param('id') id: string, @Body() dto: UpdateIntegrationDataDto) {
    return this.integrationDataService.update(id, dto);
  }

  // Eliminar un registro

  @Delete(':id')
  @ApiOperation({ summary: 'Elimina datos de integración' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'Datos de integración eliminados' })
  remove(@Param('id') id: string) {
    return this.integrationDataService.remove(id);
  }
}
