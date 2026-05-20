import { UPLOADED_VIDEO_PLACEHOLDER_THUMBNAIL } from '../constants/builderConstants';
import type {
  PresignedUploadRequest,
  PresignedUploadResponse,
  UploadVideoFileParams,
  VideoUploadResult,
  VideoUploadStatus,
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

/**
 * Mock presigned URL issuer — replace with backend API call later.
 */
export async function requestPresignedUpload(
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

/**
 * Mock file upload — simulates PUT to presigned URL with progress callbacks.
 */
export async function uploadVideoFile({
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

export function getUploadStatusLabel(status: VideoUploadStatus, progress: number): string {
  switch (status) {
    case 'preparing':
      return '업로드 준비 중…';
    case 'uploading':
      return `업로드 중 ${progress}%`;
    case 'processing':
      return '영상 처리 중…';
    case 'completed':
      return '업로드 완료';
    case 'failed':
      return '업로드 실패';
    default:
      return '';
  }
}
