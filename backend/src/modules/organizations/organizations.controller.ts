import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { Organization } from './entities/organization.entity';

@ApiTags('organizations')
@ApiBearerAuth()
@Controller('organizations')
export class OrganizationsController {
	constructor(private readonly organizationsService: OrganizationsService) {}


	@Post()
	@ApiOperation({ summary: 'Crea una organización' })
	@ApiBody({ type: Organization })
	@ApiResponse({ status: 201, description: 'Organización creada' })
	async create(@Body() body: Partial<Organization>): Promise<Organization> {
		return this.organizationsService.create(body);
	}


	@Get()
	@ApiOperation({ summary: 'Lista todas las organizaciones' })
	@ApiResponse({ status: 200, description: 'Lista de organizaciones' })
	async findAll(): Promise<Organization[]> {
		return this.organizationsService.findAll();
	}


	@Get(':id')
	@ApiOperation({ summary: 'Obtiene una organización por ID' })
	@ApiParam({ name: 'id', type: String })
	@ApiResponse({ status: 200, description: 'Organización encontrada' })
	async findOne(@Param('id') id: string): Promise<Organization | null> {
		return this.organizationsService.findOne(id);
	}
	@Patch(':id')
	@ApiOperation({ summary: 'Actualiza una organización' })
	@ApiParam({ name: 'id', type: String })
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				name: { type: 'string', example: 'Nueva Empresa S.A.' },
				phone: { type: 'string', example: '+54 11 1234-5678' },
				address: { type: 'string', example: 'Calle Falsa 123, CABA' }
			}
		}
	})
	@ApiResponse({ status: 200, description: 'Organización actualizada' })
	async update(
		@Param('id') id: string,
		@Body() body: { name?: string; phone?: string; address?: string }
	): Promise<Organization | null> {
		return this.organizationsService.update(id, body);
	}
}
