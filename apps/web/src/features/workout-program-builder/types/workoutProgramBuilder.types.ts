import type { VideoStorageProvider, VideoUploadResult } from './videoUpload.types';

export type WorkoutDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type TemplateVisibility =
  | 'private'
  | 'gym_only'
  | 'public_pending'
  | 'public'
  | 'public_rejected';

export type TemplateStatus = 'draft' | 'active' | 'archived';

export type TemplatePublicReviewStatus = 'pending' | 'approved' | 'rejected';

export type ContentSourceKind = 'own' | 'shared' | 'public';

export type WorkoutVideoMediaSource = 'uploaded' | 'youtube';

export interface WorkoutVideoYouTubeMeta {
  videoId: string;
  externalUrl: string;
  embedUrl: string;
}

/** Visibility when registering a video locally (public_pending excluded). */
export type UploadedVideoVisibility = 'private' | 'gym_only';

export interface WorkoutVideoUploadMeta {
  originalFileName: string;
  fileSizeBytes: number;
  mimeType: string;
  uploadedAt: string;
  /** Remote object key after presigned upload (API-ready). */
  storageKey?: string;
  /** Remote playback URL — never a blob: URL. */
  playbackUrl?: string;
  /** Remote thumbnail URL when different from WorkoutVideo.thumbnailUrl. */
  remoteThumbnailUrl?: string;
  /** Remote thumbnail object key for R2 cleanup on delete. */
  thumbnailStorageKey?: string;
  provider?: VideoStorageProvider;
}

export interface CreateWorkoutVideoInput {
  title: string;
  description?: string;
  durationSec: number;
  tags: string[];
  bodyParts: string[];
  difficulty: WorkoutDifficulty;
  isLoopable: boolean;
  visibility: UploadedVideoVisibility;
  isPremium?: boolean;
  originalFileName: string;
  fileSizeBytes: number;
  mimeType: string;
  /** Set after mock/real upload pipeline completes. */
  uploadResult?: VideoUploadResult;
}

export interface CreateYouTubeWorkoutVideoInput {
  title: string;
  description?: string;
  durationSec: number;
  tags: string[];
  bodyParts: string[];
  difficulty: WorkoutDifficulty;
  isLoopable: boolean;
  visibility: UploadedVideoVisibility;
  isPremium?: boolean;
  youtubeUrl: string;
  youtubeVideoId: string;
  embedUrl: string;
  thumbnailUrl: string;
  externalUrl: string;
}

export interface UpdateWorkoutVideoInput {
  title: string;
  description?: string;
  durationSec: number;
  tags: string[];
  bodyParts: string[];
  difficulty: WorkoutDifficulty;
  isLoopable: boolean;
  visibility: UploadedVideoVisibility;
  isPremium?: boolean;
}

export interface WorkoutVideo {
  id: string;
  title: string;
  description?: string;
  durationSec: number;
  thumbnailUrl: string;
  previewUrl?: string;
  tags: string[];
  difficulty: WorkoutDifficulty;
  bodyParts: string[];
  isLoopable: boolean;
  sourceType: 'private' | 'gym' | 'public';
  /** Review state when submitted to the public library (API-ready). */
  reviewStatus?: TemplateVisibility;
  contentSource?: ContentSourceKind;
  creditCost?: number;
  rewardCredit?: number;
  isPremium?: boolean;
  /** Metadata for locally registered uploads (no file/blob stored). */
  uploadMeta?: WorkoutVideoUploadMeta;
  mediaSource?: WorkoutVideoMediaSource;
  youtubeMeta?: WorkoutVideoYouTubeMeta;
}

export type ProgramBlockType = 'video' | 'rest' | 'countdown' | 'voice';

export type VideoPlayMode =
  | 'original_duration'
  | 'repeat_count'
  | 'loop_until_duration';

export interface BaseProgramBlock {
  id: string;
  type: ProgramBlockType;
  title: string;
  order: number;
  durationSec: number;
}

export interface VideoProgramBlock extends BaseProgramBlock {
  type: 'video';
  videoId: string;
  playMode: VideoPlayMode;
  repeatCount?: number;
  targetDurationSec?: number;
  restAfterSec?: number;
  playbackUrl?: string;
  thumbnailUrl?: string;
  mediaSource?: WorkoutVideoMediaSource;
  externalVideoId?: string;
  embedUrl?: string;
  voiceCues: {
    ready: boolean;
    go: boolean;
    stop: boolean;
    lastTenCount: boolean;
  };
}

export interface RestProgramBlock extends BaseProgramBlock {
  type: 'rest';
  message?: string;
  nextBlockTitle?: string;
}

export interface CountdownProgramBlock extends BaseProgramBlock {
  type: 'countdown';
  message?: string;
  countFromSec: number;
  startNumber?: number;
}

export interface VoiceProgramBlock extends BaseProgramBlock {
  type: 'voice';
  cueText: string;
  message?: string;
  voiceCue?: string;
}

export type ProgramBlock =
  | VideoProgramBlock
  | RestProgramBlock
  | CountdownProgramBlock
  | VoiceProgramBlock;

export interface PublicShareSubmissionPayload {
  title: string;
  description?: string;
  tags: string[];
}

export interface WorkoutProgramTemplate {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  totalDurationSec: number;
  blocks: ProgramBlock[];
  visibility: TemplateVisibility;
  status?: TemplateStatus;
  publicReviewStatus?: TemplatePublicReviewStatus;
  publicRejectionReason?: string;
  publicReviewedAt?: string;
  publicReviewedBy?: string;
  shareToken?: string | null;
  shareEnabled?: boolean;
  publishedAt?: string | null;
  unpublishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  /** Gym scope for multi-tenant API (optional until backend). */
  ownerGymId?: string;
}

export const BUILDER_COLORS = {
  background: '#0B0B0E',
  surface: '#15161A',
  surface2: '#1F2026',
  border: '#2C2D34',
  primary: '#FFD60A',
  primarySoft: 'rgba(255, 214, 10, 0.12)',
  textPrimary: '#FFFFFF',
  textSecondary: '#A7AAB3',
  textMuted: '#6F737C',
  danger: '#EF4444',
  success: '#22C55E',
} as const;
