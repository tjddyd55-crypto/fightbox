import { ApiError } from '../utils/apiError.js';

export interface R2Config {
  endpoint: string;
  bucketName: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl: string;
}

function trimEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function stripTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '');
}

export function getR2Config(): R2Config {
  const accessKeyId = trimEnv(process.env.R2_ACCESS_KEY_ID);
  const secretAccessKey = trimEnv(process.env.R2_SECRET_ACCESS_KEY);
  const bucketName = trimEnv(process.env.R2_BUCKET_NAME) ?? trimEnv(process.env.R2_BUCKET);
  const accountId = trimEnv(process.env.R2_ACCOUNT_ID);
  const endpointFromEnv = trimEnv(process.env.R2_ENDPOINT);

  let endpoint = endpointFromEnv ? stripTrailingSlashes(endpointFromEnv) : undefined;
  if (!endpoint && accountId) {
    endpoint = `https://${accountId}.r2.cloudflarestorage.com`;
  }

  const publicBaseUrl = stripTrailingSlashes(
    trimEnv(process.env.R2_PUBLIC_CDN_BASE) ??
      trimEnv(process.env.R2_PUBLIC_URL) ??
      '',
  );

  const missing: string[] = [];
  if (!accessKeyId) {
    missing.push('R2_ACCESS_KEY_ID');
  }
  if (!secretAccessKey) {
    missing.push('R2_SECRET_ACCESS_KEY');
  }
  if (!bucketName) {
    missing.push('R2_BUCKET_NAME or R2_BUCKET');
  }
  if (!endpoint) {
    missing.push('R2_ENDPOINT or R2_ACCOUNT_ID');
  }

  if (missing.length > 0) {
    throw new ApiError(
      503,
      'R2_NOT_CONFIGURED',
      `R2 configuration is incomplete: ${missing.join(', ')}`,
    );
  }

  return {
    endpoint: endpoint!,
    bucketName: bucketName!,
    accessKeyId: accessKeyId!,
    secretAccessKey: secretAccessKey!,
    publicBaseUrl,
  };
}
