import { Injectable } from '@nestjs/common';

// Servicio principal de la aplicación. Provee lógica básica de ejemplo.
@Injectable()
export class AppService {
  /**
   * Retorna un saludo de prueba
   */
  getHello(): string {
    return 'Hello World!';
  }
}
