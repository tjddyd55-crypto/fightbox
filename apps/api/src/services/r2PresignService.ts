import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import { getR2Config } from '../config/r2Config.js';
import { ApiError } from '../utils/apiError.js';

const MAX_FILE_SIZE_BYTES = 1024 * 1024 * 1024;
const PRESIGN_EXPIRES_IN_SECONDS = 600;

const UNSAFE_FILE_NAME_CHARS = /[/\\:*?"<>|\0]/g;

export interface CreatePresignedVideoUploadInput {
  fileName: string;
  fileSize: number;
  contentType: string;
  gymId?: string;
  uploaderId?: string;
}

export interface CreatePresignedVideoUploadResult {
  uploadUrl: string;
  storageKey: string;
  playbackUrl: string;
  thumbnailUrl: string | null;
  expiresAt: string;
}

function sanitizeFileName(fileName: string): string {
  let safe = fileName.trim().replace(/\s+/g, '-').replace(UNSAFE_FILE_NAME_CHARS, '-');
  safe = safe.replace(/-+/g, '-').replace(/^-+|-+$/g, '');

  if (safe.length > 120) {
    const dotIndex = safe.lastIndexOf('.');
    const ext = dotIndex > 0 ? safe.slice(dotIndex) : '';
    safe = `${safe.slice(0, 120 - ext.length)}${ext}`;
  }

  return safe || 'video.mp4';
}

function sanitizeMetadataValue(value: string): string {
  return encodeURIComponent(value.slice(0, 256));
}

function buildStorageKey(input: CreatePresignedVideoUploadInput): string {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const gymSegment = (input.gymId?.trim() || 'demo-gym')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '') || 'demo-gym';

  return `workout-videos/${gymSegment}/${year}/${month}/${randomUUID()}-${sanitizeFileName(input.fileName)}`;
}

function validateInput(input: CreatePresignedVideoUploadInput): void {
  if (!input.fileName.trim()) {
    throw new ApiError(400, 'INVALID_BODY', 'fileName is required');
  }

  if (!Number.isFinite(input.fileSize)) {
    throw new ApiError(400, 'INVALID_BODY', 'fileSize must be a number');
  }

  if (input.fileSize <= 0) {
    throw new ApiError(400, 'INVALID_BODY', 'fileSize must be greater than 0');
  }

  if (input.fileSize > MAX_FILE_SIZE_BYTES) {
    throw new ApiError(400, 'FILE_TOO_LARGE', 'fileSize must be 1GB or less');
  }

  const contentType = input.contentType.trim();
  if (!contentType) {
    throw new ApiError(400, 'INVALID_BODY', 'contentType is required');
  }

  if (!contentType.startsWith('video/') || contentType === 'video/*') {
    throw new ApiError(400, 'UNSUPPORTED_CONTENT_TYPE', 'Only video uploads are supported.');
  }
}

function assertPathStyleUploadUrl(uploadUrl: string, bucketName: string): void {
  const url = new URL(uploadUrl);
  const virtualHostedPrefix = `${bucketName.toLowerCase()}.`;

  if (url.hostname.toLowerCase().startsWith(virtualHostedPrefix)) {
    throw new ApiError(
      500,
      'PRESIGN_FAILED',
      'Presigned URL must use path-style addressing',
    );
  }

  if (!url.pathname.startsWith(`/${bucketName}/`)) {
    throw new ApiError(
      500,
      'PRESIGN_FAILED',
      'Presigned URL must include bucket name in the path',
    );
  }
}

export async function createPresignedVideoUpload(
  input: CreatePresignedVideoUploadInput,
): Promise<CreatePresignedVideoUploadResult> {
  validateInput(input);

  const config = getR2Config();
  const storageKey = buildStorageKey(input);
  const contentType = input.contentType.trim();

  const metadata: Record<string, string> = {
    originalFileName: sanitizeMetadataValue(input.fileName.trim()),
  };

  if (input.uploaderId?.trim()) {
    metadata.uploaderId = sanitizeMetadataValue(input.uploaderId.trim());
  }

  if (input.gymId?.trim()) {
    metadata.gymId = sanitizeMetadataValue(input.gymId.trim());
  }

  const client = new S3Client({
    region: 'auto',
    endpoint: config.endpoint,
    forcePathStyle: true,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: storageKey,
    ContentType: contentType,
    Metadata: metadata,
  });

  let uploadUrl: string;
  try {
    uploadUrl = await getSignedUrl(client, command, {
      expiresIn: PRESIGN_EXPIRES_IN_SECONDS,
    });
  } catch {
    throw new ApiError(500, 'PRESIGN_FAILED', 'Failed to create presigned upload URL');
  }

  assertPathStyleUploadUrl(uploadUrl, config.bucketName);

  const expiresAt = new Date(Date.now() + PRESIGN_EXPIRES_IN_SECONDS * 1000).toISOString();
  const playbackUrl = config.publicBaseUrl ? `${config.publicBaseUrl}/${storageKey}` : '';

  return {
    uploadUrl,
    storageKey,
    playbackUrl,
    thumbnailUrl: null,
    expiresAt,
  };
}
