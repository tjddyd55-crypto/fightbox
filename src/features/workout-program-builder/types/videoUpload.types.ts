export type VideoUploadStatus =
  | 'idle'
  | 'preparing'
  | 'uploading'
  | 'processing'
  | 'completed'
  | 'failed';

export type VideoStorageProvider = 'mock' | 'r2' | 's3';

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
