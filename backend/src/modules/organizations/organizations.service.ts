import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';

@Injectable()
export class OrganizationsService {
	constructor(
		@InjectRepository(Organization)
		private readonly organizationRepository: Repository<Organization>,
	) {}

	async create(data: Partial<Organization>): Promise<Organization> {
		const org = this.organizationRepository.create(data);
		return this.organizationRepository.save(org);
	}

	async findAll(): Promise<Organization[]> {
		return this.organizationRepository.find();
	}

	async findOne(id: string): Promise<Organization | null> {
		return this.organizationRepository.findOneBy({ id });
	}
	async update(id: string, data: { name?: string; phone?: string; address?: string }): Promise<Organization | null> {
		const org = await this.organizationRepository.findOneBy({ id });
		if (!org) return null;
		if (data.name !== undefined) org.name = data.name;
		if (data.phone !== undefined) org.phone = data.phone;
		if (data.address !== undefined) org.address = data.address;
		return this.organizationRepository.save(org);
	}
}
