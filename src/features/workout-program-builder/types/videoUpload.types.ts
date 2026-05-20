export type VideoUploadStatus =
  | 'idle'
  | 'preparing'
  | 'uploading'
  | 'processing'
  | 'completed'
  | 'failed';

/** Active client upload implementation (env: VITE_VIDEO_UPLOAD_PROVIDER). */
export type UploadProviderKind = 'mock' | 'api';

/** Object storage backend recorded on the uploaded asset. */
export type VideoStorageProvider = 'mock' | 'r2' | 's3';

/** Backend presign endpoint path (relative to VITE_API_BASE_URL). */
export const WORKOUT_VIDEO_PRESIGN_PATH = '/api/workout-videos/uploads/presign';

export interface PresignedUploadRequest {
  fileName: string;
  fileSize: number;
  contentType: string;
  checksum?: string;
  gymId?: string;
  uploaderId?: string;
}

export interface PresignedUploadResponse {
  uploadUrl: string;
  storageKey: string;
  playbackUrl: string;
  thumbnailUrl?: string;
  expiresAt: string;
}

/** POST /api/workout-videos/uploads/presign request body. */
export type PresignUploadApiRequest = PresignedUploadRequest;

/** POST /api/workout-videos/uploads/presign response body. */
export type PresignUploadApiResponse = PresignedUploadResponse;

export interface VideoUploadResult {
  storageKey: string;
  playbackUrl: string;
  thumbnailUrl?: string;
  fileName: string;
  fileSize: number;
  contentType: string;
  uploadedAt: string;
  provider: VideoStorageProvider;
}

export interface UploadVideoFileParams {
  file: File;
  presigned: PresignedUploadResponse;
  onProgress?: (percent: number) => void;
}

export interface VideoUploadAdapter {
  readonly kind: UploadProviderKind;
  requestPresignedUpload(input: PresignedUploadRequest): Promise<PresignedUploadResponse>;
  uploadVideoFile(params: UploadVideoFileParams): Promise<VideoUploadResult>;
}
