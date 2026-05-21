import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'node:crypto';
import type { PresignAssetType } from '@fightbox/shared';
import {
  getR2Config,
  resolvePresignIncludeContentType,
  resolvePresignUrlStyle,
  type R2PresignUrlStyle,
} from '../config/r2Config.js';
import { ApiError } from '../utils/apiError.js';

const MAX_FILE_SIZE_BYTES = 1024 * 1024 * 1024;
const MAX_THUMBNAIL_SIZE_BYTES = 5 * 1024 * 1024;
const PRESIGN_EXPIRES_IN_SECONDS = 600;

const UNSAFE_FILE_NAME_CHARS = /[/\\:*?"<>|\0]/g;

export interface PresignedVideoUploadDebug {
  urlStyle: R2PresignUrlStyle;
  uploadUrlOrigin: string;
  uploadUrlPathPrefix: string;
}

export interface CreatePresignedVideoUploadInput {
  fileName: string;
  fileSize: number;
  contentType: string;
  gymId?: string;
  uploaderId?: string;
  assetType?: PresignAssetType;
}

function resolveAssetType(input: CreatePresignedVideoUploadInput): PresignAssetType {
  return input.assetType === 'thumbnail' ? 'thumbnail' : 'video';
}

function getStoragePrefix(assetType: PresignAssetType): string {
  return assetType === 'thumbnail' ? 'workout-video-thumbnails' : 'workout-videos';
}

export interface CreatePresignedVideoUploadResult {
  uploadUrl: string;
  storageKey: string;
  playbackUrl: string;
  thumbnailUrl: string | null;
  expiresAt: string;
  debug?: PresignedVideoUploadDebug;
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

function buildStorageKey(input: CreatePresignedVideoUploadInput): string {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const gymSegment = (input.gymId?.trim() || 'demo-gym')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '') || 'demo-gym';
  const prefix = getStoragePrefix(resolveAssetType(input));

  return `${prefix}/${gymSegment}/${year}/${month}/${randomUUID()}-${sanitizeFileName(input.fileName)}`;
}

function validateThumbnailInput(input: CreatePresignedVideoUploadInput): void {
  if (!input.fileName.trim()) {
    throw new ApiError(400, 'INVALID_BODY', 'fileName is required');
  }

  if (!Number.isFinite(input.fileSize)) {
    throw new ApiError(400, 'INVALID_BODY', 'fileSize must be a number');
  }

  if (input.fileSize <= 0) {
    throw new ApiError(400, 'INVALID_BODY', 'fileSize must be greater than 0');
  }

  if (input.fileSize > MAX_THUMBNAIL_SIZE_BYTES) {
    throw new ApiError(400, 'FILE_TOO_LARGE', 'Thumbnail fileSize must be 5MB or less');
  }

  const contentType = input.contentType.trim().toLowerCase();
  if (!contentType) {
    throw new ApiError(400, 'INVALID_BODY', 'contentType is required');
  }

  if (contentType !== 'image/jpeg' && contentType !== 'image/webp') {
    throw new ApiError(
      400,
      'UNSUPPORTED_CONTENT_TYPE',
      'Only image/jpeg and image/webp thumbnails are supported.',
    );
  }
}

function validateVideoInput(input: CreatePresignedVideoUploadInput): void {
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

function validateInput(input: CreatePresignedVideoUploadInput): void {
  const assetType = resolveAssetType(input);
  if (assetType === 'thumbnail') {
    validateThumbnailInput(input);
    return;
  }
  validateVideoInput(input);
}

function assertUploadUrlShape(
  uploadUrl: string,
  bucketName: string,
  urlStyle: R2PresignUrlStyle,
  storagePrefix: string,
): void {
  const url = new URL(uploadUrl);
  const virtualHostedPrefix = `${bucketName.toLowerCase()}.`;
  const hostname = url.hostname.toLowerCase();

  if (urlStyle === 'path') {
    if (hostname.startsWith(virtualHostedPrefix)) {
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
    return;
  }

  if (!hostname.startsWith(virtualHostedPrefix)) {
    throw new ApiError(
      500,
      'PRESIGN_FAILED',
      'Presigned URL must use virtual-hosted-style addressing',
    );
  }

  if (!url.pathname.startsWith(`/${storagePrefix}/`)) {
    throw new ApiError(
      500,
      'PRESIGN_FAILED',
      `Presigned URL path must start with /${storagePrefix}/`,
    );
  }
}

function assertSimplePresignedUploadUrl(uploadUrl: string): void {
  const url = new URL(uploadUrl);
  const queryKeys = [...url.searchParams.keys()].map((key) => key.toLowerCase());

  for (const key of queryKeys) {
    if (key.startsWith('x-amz-meta-')) {
      throw new ApiError(500, 'PRESIGN_FAILED', 'Presigned URL must not include object metadata');
    }

    if (key === 'x-amz-sdk-checksum-algorithm' || key.startsWith('x-amz-checksum-')) {
      throw new ApiError(500, 'PRESIGN_FAILED', 'Presigned URL must not include checksum parameters');
    }
  }
}

function buildUploadUrlDebug(
  uploadUrl: string,
  urlStyle: R2PresignUrlStyle,
): PresignedVideoUploadDebug {
  const url = new URL(uploadUrl);
  const segments = url.pathname.split('/').filter(Boolean);

  const uploadUrlPathPrefix =
    urlStyle === 'path'
      ? `/${segments.slice(0, 2).join('/')}/`
      : `/${segments[0] ?? 'workout-videos'}/`;

  return {
    urlStyle,
    uploadUrlOrigin: url.origin,
    uploadUrlPathPrefix,
  };
}

export async function createPresignedVideoUpload(
  input: CreatePresignedVideoUploadInput,
): Promise<CreatePresignedVideoUploadResult> {
  validateInput(input);

  const assetType = resolveAssetType(input);
  const storagePrefix = getStoragePrefix(assetType);
  const config = getR2Config();
  const urlStyle = resolvePresignUrlStyle();
  const includeContentType = resolvePresignIncludeContentType();
  const storageKey = buildStorageKey(input);
  const contentType = input.contentType.trim();
  const forcePathStyle = urlStyle === 'path';

  const client = new S3Client({
    region: 'auto',
    endpoint: config.endpoint,
    forcePathStyle,
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  const command = new PutObjectCommand({
    Bucket: config.bucketName,
    Key: storageKey,
    ...(includeContentType ? { ContentType: contentType } : {}),
  });

  let uploadUrl: string;
  try {
    uploadUrl = await getSignedUrl(client, command, {
      expiresIn: PRESIGN_EXPIRES_IN_SECONDS,
    });
  } catch {
    throw new ApiError(500, 'PRESIGN_FAILED', 'Failed to create presigned upload URL');
  }

  assertUploadUrlShape(uploadUrl, config.bucketName, urlStyle, storagePrefix);
  assertSimplePresignedUploadUrl(uploadUrl);

  const expiresAt = new Date(Date.now() + PRESIGN_EXPIRES_IN_SECONDS * 1000).toISOString();
  const publicUrl = config.publicBaseUrl ? `${config.publicBaseUrl}/${storageKey}` : '';
  const debug = buildUploadUrlDebug(uploadUrl, urlStyle);

  return {
    uploadUrl,
    storageKey,
    playbackUrl: publicUrl,
    thumbnailUrl: assetType === 'thumbnail' ? publicUrl || null : null,
    expiresAt,
    debug,
  };
}
