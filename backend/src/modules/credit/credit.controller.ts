import { Controller, Post, Body, Param, Patch, Get, Request, UseGuards } from '@nestjs/common';
import { CreditService } from './credit.service';
import { CreateCreditDto } from './dto/create-credit.dto';
import { UpdateCreditStatusDto } from './dto/update-credit-status.dto';
import { AuthGuard } from '@nestjs/passport';
import { CreditStatus } from './entities/credit.entity';

@Controller('credit')
export class CreditController {
  constructor(private readonly creditService: CreditService) {}

  // Solicitar un crédito (usuario autenticado)
  @Post('request')
  @UseGuards(AuthGuard('jwt'))
  async requestCredit(@Body() dto: CreateCreditDto) {
    return this.creditService.requestCredit(dto);
  }

  // Sugerir monto máximo para el usuario autenticado
  @Get('suggest-max/:userId')
  @UseGuards(AuthGuard('jwt'))
  async suggestMax(@Param('userId') userId: string) {
    return { maxAmount: await this.creditService.suggestMaxAmount(userId) };
  }

  // Aprobar o rechazar crédito (solo admin)
  @Patch(':id/status')
  @UseGuards(AuthGuard('jwt'))
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
  async findByUser(@Param('userId') userId: string) {
    return this.creditService.findByUser(userId);
  }

  // Obtener un crédito por ID
  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id') id: string) {
    return this.creditService.findOne(id);
  }
}
