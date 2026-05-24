/// <reference types="@cloudflare/workers-types" />

interface CloudflareEnv {
  DB: D1Database;
  TRAINING_MATERIALS: R2Bucket;
  R2_PUBLIC_URL?: string;
}
