import type { ProgramTemplateDto } from './workoutBuilderContracts.js';

export interface PublishedProgramPlaybackItemDto {
  blockId: string;
  videoId?: string;
  title: string;
  durationSec: number;
  order: number;
  playbackUrl?: string;
  thumbnailUrl?: string | null;
  bodyParts?: string[];
  tags?: string[];
}

export interface PublishedProgramShareDto {
  id: string;
  templateId: string;
  title: string;
  description: string;
  gymId: string;
  totalDurationSec: number;
  templateJson: unknown;
  playbackItems: PublishedProgramPlaybackItemDto[];
  publishedAt: string;
}

export interface PublishProgramTemplateResponse {
  data: {
    template: ProgramTemplateDto;
    shareUrl: string;
    shareToken: string;
  };
}

export interface UnpublishProgramTemplateResponse {
  data: {
    template: ProgramTemplateDto;
  };
}

export interface PublicProgramShareResponse {
  data: PublishedProgramShareDto;
}

export const PROGRAM_SHARE_API_PATHS = {
  publishTemplate: '/api/workout-builder/templates/:id/publish',
  unpublishTemplate: '/api/workout-builder/templates/:id/unpublish',
  sharedProgram: '/api/public/programs/:shareToken',
} as const;
