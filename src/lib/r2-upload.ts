import { getCloudflareContext } from "@opennextjs/cloudflare";

type AppCloudflareEnv = CloudflareEnv & {
  TRAINING_MATERIALS: R2Bucket;
  R2_PUBLIC_URL?: string;
};

type UploadTrainingMaterialOptions = {
  key?: string;
  prefix?: string;
};

function getEnv() {
  const { env } = getCloudflareContext<{ [key: string]: unknown }>();
  return env as AppCloudflareEnv;
}

function sanitizeFileName(fileName: string) {
  return fileName
    .trim()
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, "-")
    .toLowerCase();
}

function createObjectKey(file: File, options: UploadTrainingMaterialOptions = {}) {
  if (options.key) return options.key;

  const prefix = options.prefix ?? "training-materials";
  const safeName = sanitizeFileName(file.name || "material");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const random = crypto.randomUUID();

  return `${prefix}/${timestamp}-${random}-${safeName}`;
}

export function getTrainingMaterialUrl(key: string) {
  const env = getEnv();
  const publicBaseUrl = env.R2_PUBLIC_URL || process.env.R2_PUBLIC_URL;

  if (publicBaseUrl) {
    return `${publicBaseUrl.replace(/\/$/, "")}/${key}`;
  }

  return `/api/materials/${key}`;
}

export async function uploadTrainingMaterialToR2(
  file: File,
  options: UploadTrainingMaterialOptions = {},
) {
  const env = getEnv();
  const bucket = env.TRAINING_MATERIALS;

  if (!bucket) {
    throw new Error(
      "Cloudflare R2 binding `TRAINING_MATERIALS` is missing. Configure it in wrangler.toml.",
    );
  }

  const key = createObjectKey(file, options);

  await bucket.put(key, file.stream(), {
    httpMetadata: {
      contentType: file.type || "application/octet-stream",
      contentDisposition: `inline; filename="${sanitizeFileName(file.name)}"`,
    },
    customMetadata: {
      originalName: file.name,
    },
  });

  return {
    key,
    publicUrl: getTrainingMaterialUrl(key),
  };
}

export async function getTrainingMaterialObject(key: string) {
  const env = getEnv();
  const bucket = env.TRAINING_MATERIALS;

  if (!bucket) {
    throw new Error(
      "Cloudflare R2 binding `TRAINING_MATERIALS` is missing. Configure it in wrangler.toml.",
    );
  }

  return bucket.get(key);
}
