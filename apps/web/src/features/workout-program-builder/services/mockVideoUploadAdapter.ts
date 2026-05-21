import { UPLOADED_VIDEO_PLACEHOLDER_THUMBNAIL } from '../constants/builderConstants';
import type {
  PresignedUploadRequest,
  PresignedUploadResponse,
  ThumbnailUploadResult,
  UploadGeneratedThumbnailParams,
  UploadVideoFileParams,
  VideoUploadAdapter,
  VideoUploadResult,
} from '../types/videoUpload.types';

const MOCK_STORAGE_BASE = 'https://mock-storage.fightbox.local';
const PROGRESS_STEPS = [0, 20, 50, 80, 100] as const;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function buildStorageKey(fileName: string): string {
  const safeName = sanitizeFileName(fileName);
  return `videos/${Date.now()}_${safeName}`;
}

async function requestPresignedUpload(
  input: PresignedUploadRequest,
): Promise<PresignedUploadResponse> {
  await delay(350);

  const storageKey = buildStorageKey(input.fileName);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

  return {
    uploadUrl: `${MOCK_STORAGE_BASE}/upload/${storageKey}`,
    storageKey,
    playbackUrl: `${MOCK_STORAGE_BASE}/${storageKey}`,
    thumbnailUrl: `${MOCK_STORAGE_BASE}/thumbnails/${storageKey}.jpg`,
    expiresAt,
  };
}

async function uploadVideoFile({
  file,
  presigned,
  onProgress,
}: UploadVideoFileParams): Promise<VideoUploadResult> {
  for (const percent of PROGRESS_STEPS) {
    await delay(220);
    onProgress?.(percent);
  }

  return {
    storageKey: presigned.storageKey,
    playbackUrl: presigned.playbackUrl,
    thumbnailUrl: presigned.thumbnailUrl ?? UPLOADED_VIDEO_PLACEHOLDER_THUMBNAIL,
    fileName: file.name,
    fileSize: file.size,
    contentType: file.type || 'video/*',
    uploadedAt: new Date().toISOString(),
    provider: 'mock',
  };
}

async function uploadGeneratedThumbnail({
  fileName,
}: UploadGeneratedThumbnailParams): Promise<ThumbnailUploadResult | undefined> {
  await delay(250);
  const safeName = sanitizeFileName(fileName);
  const storageKey = `thumbnails/${Date.now()}_${safeName}`;
  return {
    thumbnailUrl: `${MOCK_STORAGE_BASE}/${storageKey}`,
    thumbnailStorageKey: storageKey,
  };
}

export const mockVideoUploadAdapter: VideoUploadAdapter = {
  kind: 'mock',
  requestPresignedUpload,
  uploadVideoFile,
  uploadGeneratedThumbnail,
};
