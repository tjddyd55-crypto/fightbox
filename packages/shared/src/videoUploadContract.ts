export interface PresignedVideoUploadRequest {
  fileName: string;
  fileSize: number;
  contentType: string;
  gymId?: string;
  uploaderId?: string;
}

export interface PresignedVideoUploadResponse {
  uploadUrl: string;
  storageKey: string;
  playbackUrl: string;
  thumbnailUrl?: string | null;
  expiresAt: string;
}

export const WORKOUT_VIDEO_PRESIGN_PATH = '/api/workout-videos/uploads/presign';
