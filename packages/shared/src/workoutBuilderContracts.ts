export const WORKOUT_BUILDER_API_PATHS = {
  videos: '/api/workout-builder/videos',
  templates: '/api/workout-builder/templates',
} as const;

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
}

export interface ProgramTemplateDto {
  id: string;
  gymId: string;
  title: string;
  description: string;
  visibility: string;
  status: string;
  totalDurationSec: number;
  templateJson: unknown;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
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
