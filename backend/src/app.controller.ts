import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

// Controlador principal de la aplicación. Expone el endpoint raíz.
@Controller()
export class AppController {
  // Inyecta el servicio principal
  constructor(private readonly appService: AppService) {}

  /**
   * Endpoint raíz que retorna un saludo de prueba
   */
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
