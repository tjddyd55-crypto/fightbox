export const WORKOUT_BUILDER_API_PATHS = {
  videos: '/api/workout-builder/videos',
  templates: '/api/workout-builder/templates',
  adminPublicSubmissions: '/api/workout-builder/admin/public-submissions',
} as const;

/** Template visibility in DB/API. Legacy aliases (gym, public_approved) are normalized on read. */
export type TemplateVisibility =
  | 'private'
  | 'gym_only'
  | 'public_pending'
  | 'public'
  | 'public_rejected';

/** Template lifecycle status — separate from public review visibility. */
export type TemplateStatus = 'draft' | 'active' | 'archived';

export type TemplatePublicReviewStatus = 'pending' | 'approved' | 'rejected';

export interface ProgramTemplateDto {
  id: string;
  gymId: string;
  title: string;
  description: string;
  visibility: TemplateVisibility | string;
  status: TemplateStatus | string;
  totalDurationSec: number;
  templateJson: unknown;
  publicReviewStatus?: TemplatePublicReviewStatus | string | null;
  publicRejectionReason?: string | null;
  publicReviewedAt?: string | null;
  publicReviewedBy?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadedVideoDto {
  id: string;
  gymId: string;
  title: string;
  description: string;
  durationSec: number;
  difficulty: string;
  bodyParts: string[];
  tags: string[];
  isLoopable: boolean;
  visibility: string;
  isPremium: boolean;
  storageKey: string;
  playbackUrl: string;
  thumbnailUrl: string | null;
  thumbnailStorageKey?: string | null;
  fileName: string;
  fileSize: number;
  contentType: string;
  provider: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUploadedVideoRequest {
  id?: string;
  title: string;
  description?: string;
  durationSec: number;
  difficulty: string;
  bodyParts: string[];
  tags: string[];
  isLoopable: boolean;
  visibility: string;
  isPremium?: boolean;
  storageKey: string;
  playbackUrl?: string;
  thumbnailUrl?: string | null;
  thumbnailStorageKey?: string | null;
  fileName: string;
  fileSize: number;
  contentType: string;
  provider?: string;
}

export interface UpdateUploadedVideoRequest {
  title?: string;
  description?: string;
  durationSec?: number;
  difficulty?: string;
  bodyParts?: string[];
  tags?: string[];
  isLoopable?: boolean;
  visibility?: string;
  isPremium?: boolean;
  thumbnailStorageKey?: string | null;
}

export interface R2DeleteResult {
  deleted: string[];
  failed: { key: string; message: string }[];
}

export interface DeleteUploadedVideoResponse {
  id: string;
  deleted: boolean;
  r2: R2DeleteResult;
}

export interface SubmitPublicTemplateRequest {
  title?: string;
  description?: string;
  tags?: string[];
}

export interface RejectPublicTemplateRequest {
  reason: string;
}

export interface CreateProgramTemplateRequest {
  id?: string;
  title: string;
  description?: string;
  visibility?: string;
  status?: string;
  totalDurationSec: number;
  templateJson: unknown;
}

export interface UpdateProgramTemplateRequest {
  title?: string;
  description?: string;
  visibility?: string;
  status?: string;
  totalDurationSec?: number;
  templateJson?: unknown;
}

export interface WorkoutBuilderApiListResponse<T> {
  data: T[];
}

export interface WorkoutBuilderApiItemResponse<T> {
  data: T;
}
