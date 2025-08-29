// bcra.controller.ts
import { Controller, Post, Body, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BcraService } from './bcra.service';
import { ConsultaBcraDto } from './dto/consulta-bcra.dto';

@ApiTags('bcra')
@Controller('bcra')
export class BcraController {
    constructor(private readonly bcraService: BcraService) { }

    @Post(':userId/consulta')
    @ApiOperation({ summary: 'Consulta estado de deudores por CUIT/CUIL' })
    @ApiResponse({ status: 201, description: 'Resultado de la consulta BCRA' })
    async consultar(@Param('userId') userId: string, @Body() dto: ConsultaBcraDto) {
        return this.bcraService.consultarDeudores(userId, dto.cuitOrCuil);
    }

    @Delete(':userId')
    @ApiOperation({ summary: 'Elimina los datos BCRA por userId' })
    async deleteByUserId(@Param('userId') userId: string) {
        return this.bcraService.deleteByUserId(userId);
    }
}
