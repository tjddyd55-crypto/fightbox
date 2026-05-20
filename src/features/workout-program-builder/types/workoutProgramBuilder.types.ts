import type { VideoStorageProvider, VideoUploadResult } from './videoUpload.types';

export type WorkoutDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type TemplateVisibility =
  | 'private'
  | 'gym'
  | 'public_pending'
  | 'public_approved'
  | 'public_rejected';

export type ContentSourceKind = 'own' | 'shared' | 'public';

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
  countFromSec: number;
}

export interface VoiceProgramBlock extends BaseProgramBlock {
  type: 'voice';
  cueText: string;
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
