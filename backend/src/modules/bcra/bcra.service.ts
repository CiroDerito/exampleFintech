// bcra.service.ts
import { Injectable, BadGatewayException, ServiceUnavailableException, BadRequestException } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bcra } from './entities/bcra.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class BcraService {
  constructor(
    @InjectRepository(Bcra) private readonly bcraRepo: Repository<Bcra>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  private httpsAgent = (() => {
    const caFile = process.env.BCRA_CA_FILE;
    if (caFile && fs.existsSync(path.resolve(caFile))) {
      const ca = fs.readFileSync(path.resolve(caFile));
      return new https.Agent({ ca });
    }
    if (process.env.BCRA_TLS_INSECURE === 'true') {
      return new https.Agent({ rejectUnauthorized: false }); // SOLO DEV
    }
    return undefined;
  })();

  private http = axios.create({
    baseURL: process.env.BCRA_API_BASE ?? 'https://api.bcra.gob.ar',
    timeout: 15000,
    httpsAgent: this.httpsAgent,
    headers: { Accept: 'application/json' },
  });

  // 🔹 Helper que NO rompe en 404: devuelve null
  private async getResultsOrNull(path: string, cuit: string) {
    try {
      const { data } = await this.http.get(path);
      return data?.results ?? null;
    } catch (e: any) {
      const status = (e as AxiosError)?.response?.status;
      const msg = e?.message || '';
      const code = e?.code || '';

      const tlsProblem =
        code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE' ||
        /unable to verify the first certificate/i.test(msg);

      if (tlsProblem) throw new ServiceUnavailableException('No se pudo verificar el certificado TLS del BCRA.');
      if (status === 404) return null;                         // 👈 toleramos 404 = sin datos
      if (status === 400) throw new BadRequestException('CUIT/CUIL inválido (11 dígitos).');
      if (status) throw new BadGatewayException(`BCRA respondió ${status}`);
      throw new BadGatewayException('Fallo al consultar servicio BCRA');
    }
  }

  private pathDeudas(cuit: string) {
    return `/centraldedeudores/v1.0/Deudas/${cuit}`;
  }
  private pathHistoricas(cuit: string) {
    return `/centraldedeudores/v1.0/Deudas/Historicas/${cuit}`;
  }
  private pathCheques(cuit: string) {
    return `/centraldedeudores/v1.0/Deudas/ChequesRechazados/${cuit}`;
  }

  async consultarDeudores(userId: string, cuitOrCuil: string) {
    // Traemos cada recurso de forma TOLERANTE
    const [deudas, historicas, cheques] = await Promise.all([
      this.getResultsOrNull(this.pathDeudas(cuitOrCuil), cuitOrCuil),
      this.getResultsOrNull(this.pathHistoricas(cuitOrCuil), cuitOrCuil),
      this.getResultsOrNull(this.pathCheques(cuitOrCuil), cuitOrCuil),
    ]);

    // Persistencia
    const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['bcra'] });
    if (!user) throw new BadRequestException('Usuario no encontrado');

    let registro = user.bcra ?? this.bcraRepo.create({ user });
    registro.cuitOrCuil = cuitOrCuil;
    registro.deudas = deudas;                   
    registro.historicas = historicas;           
    registro.chequesRechazados = cheques;       

    return this.bcraRepo.save(registro);
  }
}
