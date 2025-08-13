import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Credit, CreditStatus } from './entities/credit.entity';
import { User } from '../users/entities/user.entity';
import { Score } from '../score/entities/score.entity';
import { CreateCreditDto } from './dto/create-credit.dto';

@Injectable()
export class CreditService {
  // Aquí irá la lógica de negocio para créditos
  constructor(
    @InjectRepository(Credit)
    private readonly creditRepository: Repository<Credit>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Score)
    private readonly scoreRepository: Repository<Score>,
  ) {}

  // Lógica para sugerir el monto máximo según el score
  async suggestMaxAmount(userId: string): Promise<number> {
    const score = await this.scoreRepository.findOne({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
    if (!score) throw new NotFoundException('Score no encontrado para el usuario');
    // Ejemplo: el máximo es 10x el score
    return Number(score.value) * 10;
  }

  // Solicitar un crédito (status: pending)
  async requestCredit(dto: CreateCreditDto) {
    const user = await this.userRepository.findOne({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const maxAmount = await this.suggestMaxAmount(dto.userId);
    if (dto.amount > maxAmount) {
      throw new BadRequestException(`El monto máximo sugerido para tu score es ${maxAmount}`);
    }

    const score = await this.scoreRepository.findOne({
      where: { user: { id: dto.userId } },
      order: { createdAt: 'DESC' },
    });

    const credit = this.creditRepository.create({
      user,
      amount: dto.amount,
      status: CreditStatus.PENDING,
      score: score || undefined,
    });
    return this.creditRepository.save(credit);
  }

  // Aprobar o rechazar un crédito (solo admin)
  async updateStatus(creditId: string, status: CreditStatus, adminUser: User) {
    if (adminUser.role !== 'admin') {
      throw new ForbiddenException('Solo un admin puede aprobar o rechazar créditos');
    }
    const credit = await this.creditRepository.findOne({ where: { id: creditId }, relations: ['user'] });
    if (!credit) throw new NotFoundException('Crédito no encontrado');
    if (credit.status !== CreditStatus.PENDING) {
      throw new BadRequestException('Solo créditos pendientes pueden ser actualizados');
    }
    credit.status = status;
    return this.creditRepository.save(credit);
  }

  // Listar créditos de un usuario
  async findByUser(userId: string) {
    return this.creditRepository.find({ where: { user: { id: userId } }, relations: ['score'] });
  }

  // Obtener un crédito por ID
  async findOne(id: string) {
    return this.creditRepository.findOne({ where: { id }, relations: ['user', 'score'] });
  }
}
