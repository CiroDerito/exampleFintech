import { Controller, Get, InternalServerErrorException } from '@nestjs/common';
import { GcsService } from './gcs.service';

@Controller('gcs')
export class GcsSelfTestController {
  constructor(private readonly gcs: GcsService) {}

@Get('self-test')
async test() {
  const now = new Date().toISOString().replace(/[:.-]/g, '');
  const path = `detroit/selftest/${now}.json`;
  const url = await this.gcs.uploadJson(path, { ping: 'ok', at: new Date().toISOString() });
  return { ok: true, url };
}
}
