export type R2PresignUrlStyle = 'path' | 'virtual';

export type PresignAssetType = 'video' | 'thumbnail';

export interface PresignedVideoUploadRequest {
  fileName: string;
  fileSize: number;
  contentType: string;
  gymId?: string;
  uploaderId?: string;
  assetType?: PresignAssetType;
}

export interface PresignedVideoUploadDebug {
  urlStyle: R2PresignUrlStyle;
  uploadUrlOrigin: string;
  uploadUrlPathPrefix: string;
}

export interface PresignedVideoUploadResponse {
  uploadUrl: string;
  storageKey: string;
  playbackUrl: string;
  thumbnailUrl?: string | null;
  expiresAt: string;
  debug?: PresignedVideoUploadDebug;
}

export const WORKOUT_VIDEO_PRESIGN_PATH = '/api/workout-videos/uploads/presign';
