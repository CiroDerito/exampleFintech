import { Injectable, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Score } from './entities/score.entity';
import { User } from '../users/entities/user.entity';
import { SyncScoreDto } from './dto/sync-score.dto';

@Injectable()
export class ScoreService {
  constructor(
    @InjectRepository(Score)
    private scoreRepository: Repository<Score>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Sincroniza/actualiza el score de un usuario desde BigQuery por email
   */
  async syncUserScore(syncScoreDto: SyncScoreDto): Promise<Score> {
    try {
      const { email } = syncScoreDto;

      // Consultar score desde BigQuery por email
      const externalScoreData = await this.fetchScoreFromBigQuery(email);
      
      // Buscar si ya existe un score para este email
      let existingScore = await this.scoreRepository.findOne({
        where: { email },
        relations: ['user'],
      });

      // Intentar vincular con usuario si existe
      const user = await this.userRepository.findOne({ where: { email } });

      if (existingScore) {
        // Actualizar score existente
        existingScore.value = externalScoreData.score;
        existingScore.details = {
          source: 'bigquery',
          rawData: externalScoreData,
          syncedAt: new Date(),
        };
        existingScore.user = user || undefined;
        
        return await this.scoreRepository.save(existingScore);
      } else {
        // Crear nuevo registro de score
        const newScore = this.scoreRepository.create({
          email,
          user: user || undefined,
          value: externalScoreData.score,
          details: {
            source: 'bigquery',
            rawData: externalScoreData,
            syncedAt: new Date(),
          },
        });

        return await this.scoreRepository.save(newScore);
      }
    } catch (error) {
      throw new HttpException(
        `Error al sincronizar score: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Ejecuta la sincronización diaria de todos los emails en BigQuery
   */
  async syncDailyScores(): Promise<{ synchronized: number; errors: number }> {
    try {
      // Obtener todos los emails desde BigQuery
      const emailsFromBigQuery = await this.getAllEmailsFromBigQuery();

      let synchronized = 0;
      let errors = 0;

      for (const email of emailsFromBigQuery) {
        try {
          await this.syncUserScore({ email });
          synchronized++;
        } catch (error) {
          console.error(`Error sincronizando email ${email}:`, error.message);
          errors++;
        }
      }

      return { synchronized, errors };
    } catch (error) {
      throw new HttpException(
        `Error en sincronización diaria: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Obtiene el score más reciente de un usuario por email
   */
  async getLatestScoreByEmail(email: string): Promise<Score | null> {
    return await this.scoreRepository.findOne({
      where: { email },
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
  }

  /**
   * Obtiene el score más reciente de un usuario por userId
   */
  async getLatestScoreByUserId(userId: string): Promise<Score | null> {
    return await this.scoreRepository.findOne({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
  }

  /**
   * Obtiene todos los scores de un usuario por email
   */
  async getScoresByEmail(email: string): Promise<Score[]> {
    return await this.scoreRepository.find({
      where: { email },
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
  }

  /**
   * Obtiene todos los scores de un usuario por userId
   */
  async getScoresByUserId(userId: string): Promise<Score[]> {
    return await this.scoreRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });
  }

  /**
   * Función para consultar score desde BigQuery por email
   */
  private async fetchScoreFromBigQuery(email: string): Promise<any> {
    // TODO: Implementar llamada real a BigQuery
    // const { BigQuery } = require('@google-cloud/bigquery');
    // const bigquery = new BigQuery({
    //   projectId: externalApisConfig.bigquery.projectId,
    //   keyFilename: externalApisConfig.bigquery.keyFilename,
    // });

    // const query = `
    //   SELECT score, factors, bureau_data, calculated_at
    //   FROM \`${externalApisConfig.bigquery.projectId}.${externalApisConfig.bigquery.dataset}.${externalApisConfig.bigquery.table}\`
    //   WHERE email = @email
    //   ORDER BY calculated_at DESC
    //   LIMIT 1
    // `;

    // const [rows] = await bigquery.query({
    //   query,
    //   params: { email },
    // });

    // return rows[0];

    // Por ahora simulamos la respuesta de BigQuery
    const mockScoreData = {
      score: Math.floor(Math.random() * (900 - 300 + 1)) + 300, // Score entre 300-900
      factors: {
        payment_history: 0.35,
        credit_utilization: 0.30,
        length_of_history: 0.15,
        credit_mix: 0.10,
        new_credit: 0.10,
      },
      bureau_data: {
        veraz: { score: 750, risk: 'low' },
        nosis: { score: 720, risk: 'medium' },
      },
      calculated_at: new Date().toISOString(),
      email,
    };

    return mockScoreData;
  }

  /**
   * Obtiene todos los emails disponibles en BigQuery
   */
  private async getAllEmailsFromBigQuery(): Promise<string[]> {
    // TODO: Implementar consulta real a BigQuery
    // const query = `
    //   SELECT DISTINCT email
    //   FROM \`${externalApisConfig.bigquery.projectId}.${externalApisConfig.bigquery.dataset}.${externalApisConfig.bigquery.table}\`
    //   WHERE email IS NOT NULL
    // `;

    // Por ahora simulamos emails de prueba
    const mockEmails = [
      'user1@example.com',
      'user2@example.com',
      'user3@example.com',
    ];

    return mockEmails;
  }

  /**
   * Lista todos los scores con paginación
   */
  async getAllScores(page: number = 1, limit: number = 10): Promise<{ scores: Score[]; total: number }> {
    const [scores, total] = await this.scoreRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['user'],
    });

    return { scores, total };
  }

  /**
   * Obtiene un score por ID
   */
  async getScoreById(id: string): Promise<Score> {
    const score = await this.scoreRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!score) {
      throw new HttpException('Score no encontrado', HttpStatus.NOT_FOUND);
    }

    return score;
  }
}
