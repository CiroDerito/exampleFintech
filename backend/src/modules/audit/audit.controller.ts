import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('audit')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Obtener logs de auditoría (admin)' })
  @ApiResponse({ status: 200, description: 'Lista de logs de auditoría' })
  async getLogs() {
    return this.auditService.findAll();
  }
}
