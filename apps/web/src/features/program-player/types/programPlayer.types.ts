export type ProgramPlayerBlockType = 'video' | 'rest' | 'countdown' | 'voice';

export type ProgramPlayerVideoPlaybackMode =
  | 'original_duration'
  | 'repeat_count'
  | 'loop_until_duration';

export type ProgramPlayerMode =
  | 'start'
  | 'video'
  | 'rest'
  | 'countdown'
  | 'voice'
  | 'complete';

export type ProgramPlayerViewMode = 'single' | 'display' | 'coach' | 'queue';

export type ProgramPlayerSource = 'template' | 'share' | 'mock';

export interface ProgramPlayerBlock {
  id: string;
  type: ProgramPlayerBlockType;
  order: number;
  title: string;
  description?: string;
  /** Rest / countdown / voice guidance text */
  message?: string;
  durationSec: number;
  /** Single-loop video length (for repeat UI). */
  singleLoopDurationSec?: number;
  subtitle?: string;
  videoId?: string;
  playbackUrl?: string;
  thumbnailUrl?: string | null;
  bodyParts?: string[];
  tags?: string[];
  playbackMode?: ProgramPlayerVideoPlaybackMode;
  repeatCount?: number;
  targetDurationSec?: number;
  restAfterSec?: number;
  mediaSource?: 'uploaded' | 'youtube';
  externalVideoId?: string;
  embedUrl?: string;
}

export interface ProgramPlayerProgram {
  id: string;
  title: string;
  description?: string;
  totalDurationSec: number;
  blocks: ProgramPlayerBlock[];
  source: ProgramPlayerSource;
  shareToken?: string;
}

export interface ProgramPlayerMeta {
  title: string;
  totalDurationSec: number;
  totalBlocks: number;
  summary: {
    video: number;
    rest: number;
    countdown: number;
    voice: number;
  };
  flowPreview: string;
}

export interface ProgramPlayerSnapshot {
  mode: ProgramPlayerMode;
  currentIndex: number;
  isPlaying: boolean;
  elapsedSec: number;
  currentRepeatIndex?: number;
  /** Broadcast drift correction — wall clock ms when snapshot was sent */
  timestamp?: number;
}

export type ProgramPlayerOutgoingMessage =
  | { type: 'SYNC'; payload: ProgramPlayerSnapshot }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'NEXT' }
  | { type: 'PREVIOUS' }
  | { type: 'RESTART' }
  | { type: 'START' }
  | { type: 'COMPLETE' }
  | { type: 'RETURN_TO_START' }
  | { type: 'JUMP_TO_BLOCK'; index: number };

export type ProgramPlayerBroadcastMessage = ProgramPlayerOutgoingMessage & {
  sourceId: string;
};
