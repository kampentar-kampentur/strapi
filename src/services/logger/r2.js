'use strict';

const crypto = require('crypto');
const { redact } = require('./redact');

let S3Client, PutObjectCommand;
try {
  ({ S3Client, PutObjectCommand } = require('@aws-sdk/client-s3'));
} catch (e) {
  try {
    ({ S3Client, PutObjectCommand } = require('@strapi/provider-upload-aws-s3/node_modules/@aws-sdk/client-s3'));
  } catch (err) {
    S3Client = null;
  }
}

class R2LogShipper {
  constructor() {
    this.buffer = [];
    this.batchSize = 50;
    this.flushIntervalMs = 30000;
    this.s3 = null;
    this.bucket = process.env.CF_R2_LOGS_BUCKET || process.env.CF_R2_BUCKET || process.env.R2_BUCKET;
    this.prefix = process.env.CF_R2_LOGS_PREFIX || 'logs';
    this.init();
  }

  init() {
    const accessKeyId = process.env.CF_R2_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.CF_R2_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;
    const endpoint = process.env.CF_R2_ENDPOINT || process.env.R2_ENDPOINT;

    if (S3Client && accessKeyId && secretAccessKey && endpoint && this.bucket) {
      try {
        this.s3 = new S3Client({
          region: 'auto',
          endpoint,
          credentials: { accessKeyId, secretAccessKey },
        });
        const timer = setInterval(() => this.flush().catch(() => {}), this.flushIntervalMs);
        if (timer.unref) timer.unref();
      } catch (err) {
        process.stderr.write(`[R2LogShipper] Init failed: ${err.message}\n`);
      }
    }
  }

  push(entry) {
    if (!this.s3) return;
    this.buffer.push(entry);
    if (this.buffer.length >= this.batchSize) {
      this.flush().catch(() => {});
    }
  }

  async flush() {
    if (!this.s3 || this.buffer.length === 0) return;

    const items = [...this.buffer];
    this.buffer = [];

    const now = new Date();
    const datePartition = now.toISOString().split('T')[0];
    const key = `${this.prefix}/${datePartition}/${now.getTime()}-${crypto.randomBytes(4).toString('hex')}.ndjson`;
    const ndjson = items.map((e) => JSON.stringify(redact(e))).join('\n') + '\n';

    try {
      await this.s3.send(new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: Buffer.from(ndjson, 'utf-8'),
        ContentType: 'application/x-ndjson',
      }));
    } catch (err) {
      process.stderr.write(`[R2LogShipper] Upload failed (${key}): ${err.message}\n`);
    }
  }
}

const r2Shipper = new R2LogShipper();

module.exports = {
  pushToR2: (entry) => r2Shipper.push(entry),
  flushR2: () => r2Shipper.flush(),
};
