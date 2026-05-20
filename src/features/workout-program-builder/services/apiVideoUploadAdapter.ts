import {
  WORKOUT_VIDEO_PRESIGN_PATH,
  type PresignUploadApiRequest,
  type PresignUploadApiResponse,
  type PresignedUploadRequest,
  type UploadVideoFileParams,
  type VideoStorageProvider,
  type VideoUploadAdapter,
  type VideoUploadResult,
} from '../types/videoUpload.types';
import { getApiBaseUrl } from './videoUploadConfig';

export class VideoUploadApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'VideoUploadApiError';
    this.status = status;
  }
}

function inferStorageProvider(uploadUrl: string): VideoStorageProvider {
  if (uploadUrl.includes('amazonaws.com')) {
    return 's3';
  }
  if (uploadUrl.includes('r2.cloudflarestorage.com')) {
    return 'r2';
  }
  return 'r2';
}

function putFileWithProgress(
  uploadUrl: string,
  file: File,
  contentType: string,
  onProgress?: (percent: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', contentType);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) {
        return;
      }
      const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
      onProgress(percent);
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
        return;
      }
      reject(new VideoUploadApiError(`Upload failed with status ${xhr.status}`, xhr.status));
    };

    xhr.onerror = () => {
      reject(new VideoUploadApiError('Network error during file upload'));
    };

    xhr.send(file);
  });
}

async function requestPresignedUpload(
  input: PresignedUploadRequest,
): Promise<PresignUploadApiResponse> {
  const body: PresignUploadApiRequest = {
    fileName: input.fileName,
    fileSize: input.fileSize,
    contentType: input.contentType,
    ...(input.checksum !== undefined ? { checksum: input.checksum } : {}),
    ...(input.gymId !== undefined ? { gymId: input.gymId } : {}),
    ...(input.uploaderId !== undefined ? { uploaderId: input.uploaderId } : {}),
  };

  const response = await fetch(`${getApiBaseUrl()}${WORKOUT_VIDEO_PRESIGN_PATH}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new VideoUploadApiError(
      `Presign request failed with status ${response.status}`,
      response.status,
    );
  }

  return (await response.json()) as PresignUploadApiResponse;
}

async function uploadVideoFile({
  file,
  presigned,
  onProgress,
}: UploadVideoFileParams): Promise<VideoUploadResult> {
  const contentType = file.type || 'video/*';
  await putFileWithProgress(presigned.uploadUrl, file, contentType, onProgress);

  return {
    storageKey: presigned.storageKey,
    playbackUrl: presigned.playbackUrl,
    thumbnailUrl: presigned.thumbnailUrl,
    fileName: file.name,
    fileSize: file.size,
    contentType,
    uploadedAt: new Date().toISOString(),
    provider: inferStorageProvider(presigned.uploadUrl),
  };
}

export const apiVideoUploadAdapter: VideoUploadAdapter = {
  kind: 'api',
  requestPresignedUpload,
  uploadVideoFile,
};
