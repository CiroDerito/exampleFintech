import { Controller, Post, Body, Param, Patch, Get, Request, UseGuards } from '@nestjs/common';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import { CreditService } from './credit.service';
import { CreateCreditDto } from './dto/create-credit.dto';
import { UpdateCreditStatusDto } from './dto/update-credit-status.dto';
import { AuthGuard } from '@nestjs/passport';
import { CreditStatus } from './entities/credit.entity';

// Controlador de créditos. Expone endpoints para solicitar, consultar y actualizar créditos.
@Controller('credit')
export class CreditController {
  // Inyecta el servicio de créditos
  constructor(private readonly creditService: CreditService) {}

  /**
   * Endpoint para solicitar un crédito (usuario autenticado)
   * @param dto - DTO con los datos del crédito
   * @returns Crédito creado
   */
  @Post('request')
  @UseGuards(AuthGuard('jwt'))
  @ApiBody({ schema: { properties: { amount: { type: 'number', example: 10000 }, userId: { type: 'string', example: 'uuid-user' } } } })
  @ApiResponse({ status: 201, description: 'Crédito creado', schema: { example: { id: 'uuid-credit', amount: 10000, userId: 'uuid-user', status: 'pending', createdAt: '2024-01-01T00:00:00.000Z' } } })
  async requestCredit(@Body() dto: CreateCreditDto) {
    return this.creditService.requestCredit(dto);
  }

  /**
   * Endpoint para sugerir el monto máximo para el usuario autenticado
   * @param userId - ID del usuario
   * @returns Monto máximo sugerido
   */
  @Get('suggest-max/:userId')
  @UseGuards(AuthGuard('jwt'))
  async suggestMax(@Param('userId') userId: string) {
    return { maxAmount: await this.creditService.suggestMaxAmount(userId) };
  }

  /**
   * Endpoint para aprobar o rechazar crédito (solo admin)
   * @param id - ID del crédito
   * @param dto - DTO con el nuevo estado
   * @param req - Request con el usuario autenticado
   * @returns Crédito actualizado
   */
  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'))
  @ApiBody({ type: UpdateCreditStatusDto, examples: { default: { value: { status: 'approved' } } } })
  @ApiResponse({ status: 200, description: 'Estado actualizado', schema: { example: { id: 'uuid-credit', status: 'approved', updatedAt: '2024-01-02T00:00:00.000Z' } } })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCreditStatusDto,
    @Request() req,
  ) {
    return this.creditService.updateStatus(id, dto.status, req.user);
  }

  // Listar créditos de un usuario
  @Get('user/:userId')
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({ status: 200, description: 'Lista de créditos', schema: { example: [ { id: 'uuid-credit', amount: 10000, userId: 'uuid-user', status: 'pending', createdAt: '2024-01-01T00:00:00.000Z' } ] } })
  async findByUser(@Param('userId') userId: string) {
    return this.creditService.findByUser(userId);
  }

  // Obtener un crédito por ID
  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  @ApiResponse({ status: 200, description: 'Crédito encontrado', schema: { example: { id: 'uuid-credit', amount: 10000, userId: 'uuid-user', status: 'pending', createdAt: '2024-01-01T00:00:00.000Z' } } })
  async findOne(@Param('id') id: string) {
    return this.creditService.findOne(id);
  }
}
