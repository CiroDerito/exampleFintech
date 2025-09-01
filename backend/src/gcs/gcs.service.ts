// src/gcs/gcs.service.ts
import { Injectable } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import { ensureGoogleCreds } from './credentials';

@Injectable()
export class GcsService {
  private storage = new Storage(ensureGoogleCreds());
  private bucketName = process.env.GCS_BUCKET!;

  async uploadJson(objectPath: string, data: unknown) {
  try {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(objectPath);
    const payload = Buffer.from(JSON.stringify(data));
    await file.save(payload, { contentType: 'application/json; charset=utf-8', resumable: false });
    return `gs://${this.bucketName}/${objectPath}`;
  } catch (e: any) {
    console.error('GCS uploadJson ERROR:', e?.message, e?.errors ?? '');
    throw e;
  }
}

async ensureTenantPrefix(tenant: string, provider: string) {
  const key = `${tenant}/${provider}/_init.json`;
  await this.storage
    .bucket(this.bucketName)
    .file(key)
    .save(
      Buffer.from(JSON.stringify({ initialized_at: new Date().toISOString() })),
      { contentType: 'application/json; charset=utf-8', resumable: false }
    );
  return `gs://${this.bucketName}/${key}`;
}
}
