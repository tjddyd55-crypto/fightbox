import {
  WORKOUT_VIDEO_PRESIGN_PATH,
  type PresignUploadApiRequest,
  type PresignUploadApiResponse,
  type PresignedUploadRequest,
  type UploadGeneratedThumbnailParams,
  type UploadVideoFileParams,
  type VideoStorageProvider,
  type VideoUploadAdapter,
  type VideoUploadResult,
} from '../types/videoUpload.types';
import { getApiBaseUrl, resolveR2UploadIncludeContentType } from './videoUploadConfig';

export class VideoUploadApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'VideoUploadApiError';
    this.status = status;
  }
}

function buildPresignUrl(): string {
  return `${getApiBaseUrl()}${WORKOUT_VIDEO_PRESIGN_PATH}`;
}

interface ApiErrorResponseBody {
  error?: {
    code?: string;
    message?: string;
  };
}

function buildSafeUploadTarget(uploadUrl: string): string {
  try {
    const url = new URL(uploadUrl);
    return `${url.origin}${url.pathname}`;
  } catch {
    return '(unknown target)';
  }
}

function appendPutDebugSuffix(
  message: string,
  safeTarget: string,
  status: number,
  statusText: string,
): string {
  return `${message} target=${safeTarget} transport=xhr PUT xhrStatus=${status} xhrStatusText=${statusText || 'none'}`;
}

function formatPutErrorMessage(
  status: number,
  statusText: string,
  safeTarget: string,
): string {
  if (status === 0) {
    return appendPutDebugSuffix(
      'R2 업로드 네트워크 실패(status 0). CORS, TLS, 네트워크 차단 가능성이 있습니다.',
      safeTarget,
      status,
      statusText,
    );
  }

  if (status === 403) {
    return appendPutDebugSuffix(
      'R2 업로드 권한/서명 실패(403). Content-Type 또는 presigned URL 서명을 확인하세요.',
      safeTarget,
      status,
      statusText,
    );
  }

  if (status === 400) {
    return appendPutDebugSuffix('R2 업로드 요청 형식 오류(400).', safeTarget, status, statusText);
  }

  const statusLabel = statusText ? `${status} ${statusText}` : String(status);
  return appendPutDebugSuffix(`R2 업로드 실패: HTTP ${statusLabel}`, safeTarget, status, statusText);
}

async function readPresignErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as ApiErrorResponseBody;
    if (data.error?.message) {
      return data.error.message;
    }
    if (data.error?.code) {
      return data.error.code;
    }
  } catch {
    // ignore JSON parse errors
  }

  return response.statusText || 'unknown error';
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

function putBlobWithProgress(
  uploadUrl: string,
  blob: Blob,
  contentType: string,
  includeContentType: boolean,
  onProgress?: (percent: number) => void,
): Promise<void> {
  const safeTarget = buildSafeUploadTarget(uploadUrl);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    if (includeContentType) {
      xhr.setRequestHeader('Content-Type', contentType);
    }

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

      reject(
        new VideoUploadApiError(
          formatPutErrorMessage(xhr.status, xhr.statusText, safeTarget),
          xhr.status,
        ),
      );
    };

    xhr.onerror = () => {
      reject(
        new VideoUploadApiError(
          appendPutDebugSuffix(
            'R2 썸네일 업로드 네트워크 실패(onerror).',
            safeTarget,
            xhr.status,
            xhr.statusText,
          ),
          xhr.status || 0,
        ),
      );
    };

    xhr.onabort = () => {
      reject(
        new VideoUploadApiError(
          appendPutDebugSuffix(
            'R2 썸네일 업로드가 중단되었습니다(onabort).',
            safeTarget,
            xhr.status,
            xhr.statusText,
          ),
          xhr.status || 0,
        ),
      );
    };

    xhr.ontimeout = () => {
      reject(
        new VideoUploadApiError(
          appendPutDebugSuffix(
            'R2 썸네일 업로드 시간이 초과되었습니다(ontimeout).',
            safeTarget,
            xhr.status,
            xhr.statusText,
          ),
          xhr.status || 0,
        ),
      );
    };

    xhr.send(blob);
  });
}

function putFileWithProgress(
  uploadUrl: string,
  file: File,
  contentType: string,
  includeContentType: boolean,
  onProgress?: (percent: number) => void,
): Promise<void> {
  const safeTarget = buildSafeUploadTarget(uploadUrl);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    if (includeContentType) {
      xhr.setRequestHeader('Content-Type', contentType);
    }

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

      reject(
        new VideoUploadApiError(
          formatPutErrorMessage(xhr.status, xhr.statusText, safeTarget),
          xhr.status,
        ),
      );
    };

    xhr.onerror = () => {
      reject(
        new VideoUploadApiError(
          appendPutDebugSuffix(
            'R2 업로드 네트워크 실패(onerror). CORS, TLS, 네트워크 차단 가능성이 있습니다.',
            safeTarget,
            xhr.status,
            xhr.statusText,
          ),
          xhr.status || 0,
        ),
      );
    };

    xhr.onabort = () => {
      reject(
        new VideoUploadApiError(
          appendPutDebugSuffix(
            'R2 업로드가 중단되었습니다(onabort).',
            safeTarget,
            xhr.status,
            xhr.statusText,
          ),
          xhr.status || 0,
        ),
      );
    };

    xhr.ontimeout = () => {
      reject(
        new VideoUploadApiError(
          appendPutDebugSuffix(
            'R2 업로드 시간이 초과되었습니다(ontimeout).',
            safeTarget,
            xhr.status,
            xhr.statusText,
          ),
          xhr.status || 0,
        ),
      );
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
    ...(input.assetType !== undefined ? { assetType: input.assetType } : {}),
  };

  let response: Response;
  try {
    response = await fetch(buildPresignUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new VideoUploadApiError(
      'presign API 네트워크 실패. API 서버 연결 또는 VITE_API_BASE_URL을 확인하세요.',
    );
  }

  if (!response.ok) {
    const message = await readPresignErrorMessage(response);
    throw new VideoUploadApiError(`presign API 실패: ${response.status} ${message}`, response.status);
  }

  return (await response.json()) as PresignUploadApiResponse;
}

async function uploadGeneratedThumbnail({
  blob,
  fileName,
  contentType,
  onProgress,
}: UploadGeneratedThumbnailParams): Promise<string | undefined> {
  const presigned = await requestPresignedUpload({
    fileName,
    fileSize: blob.size,
    contentType,
    assetType: 'thumbnail',
  });

  const includeContentType = resolveR2UploadIncludeContentType();
  await putBlobWithProgress(
    presigned.uploadUrl,
    blob,
    contentType,
    includeContentType,
    onProgress,
  );

  const thumbnailUrl = presigned.thumbnailUrl ?? presigned.playbackUrl ?? '';
  if (thumbnailUrl.startsWith('http://') || thumbnailUrl.startsWith('https://')) {
    return thumbnailUrl;
  }

  return undefined;
}

async function uploadVideoFile({
  file,
  presigned,
  onProgress,
}: UploadVideoFileParams): Promise<VideoUploadResult> {
  const contentType = file.type || 'video/*';
  const includeContentType = resolveR2UploadIncludeContentType();
  await putFileWithProgress(
    presigned.uploadUrl,
    file,
    contentType,
    includeContentType,
    onProgress,
  );

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
  uploadGeneratedThumbnail,
};
