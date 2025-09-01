// src/gcs/credentials.ts
import { tmpdir } from 'os';
import { writeFileSync } from 'fs';
import { join } from 'path';

export function ensureGoogleCreds(): { keyFilename?: string } {
  try {
    const b64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_B64;
    if (b64) {
      const json = Buffer.from(b64, 'base64').toString('utf8');
      const obj = JSON.parse(json);
      if (!obj.private_key || !obj.client_email) {
        throw new Error('Credencial GCP inválida: falta private_key o client_email');
      }
      const p = join(tmpdir(), 'gcp-sa.json');
      writeFileSync(p, JSON.stringify(obj), { encoding: 'utf8' });
      return { keyFilename: p };
    }
    const inline = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    if (inline) {
      const obj = JSON.parse(inline);
      if (!obj.private_key || !obj.client_email) {
        throw new Error('Credencial GCP inválida: falta private_key o client_email (inline)');
      }
      const p = join(tmpdir(), 'gcp-sa.json');
      writeFileSync(p, JSON.stringify(obj), { encoding: 'utf8' });
      return { keyFilename: p };
    }
    return {};
  } catch (e: any) {
    console.error('ensureGoogleCreds ERROR:', e?.message);
    throw e;
  }
}
