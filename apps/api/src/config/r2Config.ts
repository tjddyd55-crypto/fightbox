import { ApiError } from '../utils/apiError.js';

export interface R2Config {
  endpoint: string;
  bucketName: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl: string;
}

export type R2PresignUrlStyle = 'path' | 'virtual';

const DEFAULT_PRESIGN_URL_STYLE: R2PresignUrlStyle = 'path';

function trimEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function stripTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '');
}

function normalizeEndpoint(rawEndpoint: string): string {
  let endpointUrl: URL;
  try {
    endpointUrl = new URL(rawEndpoint);
  } catch {
    throw new ApiError(503, 'R2_NOT_CONFIGURED', 'R2_ENDPOINT is not a valid URL');
  }

  if (endpointUrl.pathname !== '/' && endpointUrl.pathname !== '') {
    throw new ApiError(
      503,
      'R2_NOT_CONFIGURED',
      'R2_ENDPOINT must not include a bucket path. Use the account endpoint only.',
    );
  }

  return stripTrailingSlashes(endpointUrl.origin);
}

export function resolvePresignUrlStyle(): R2PresignUrlStyle {
  const raw = process.env.R2_PRESIGN_URL_STYLE?.trim().toLowerCase();
  if (raw === 'virtual') {
    return 'virtual';
  }
  return DEFAULT_PRESIGN_URL_STYLE;
}

export function resolvePresignIncludeContentType(): boolean {
  const raw = process.env.R2_PRESIGN_INCLUDE_CONTENT_TYPE?.trim().toLowerCase();
  return raw === 'true';
}

export function resolveR2DiagnosticsEnabled(): boolean {
  const raw = process.env.ENABLE_R2_DIAGNOSTICS?.trim().toLowerCase();
  return raw === 'true';
}

export function getR2Config(): R2Config {
  const accessKeyId = trimEnv(process.env.R2_ACCESS_KEY_ID);
  const secretAccessKey = trimEnv(process.env.R2_SECRET_ACCESS_KEY);
  const bucketName = trimEnv(process.env.R2_BUCKET_NAME) ?? trimEnv(process.env.R2_BUCKET);
  const accountId = trimEnv(process.env.R2_ACCOUNT_ID);
  const endpointFromEnv = trimEnv(process.env.R2_ENDPOINT);

  let endpoint = endpointFromEnv ? normalizeEndpoint(endpointFromEnv) : undefined;
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
