export type WorkoutDifficulty = 'beginner' | 'intermediate' | 'advanced';

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

export interface WorkoutProgramTemplate {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  totalDurationSec: number;
  blocks: ProgramBlock[];
  visibility: 'private' | 'gym' | 'public_pending' | 'public_approved';
  updatedAt: string;
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
