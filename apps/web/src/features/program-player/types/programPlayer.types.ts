export type ProgramPlayerBlockType = 'video' | 'rest' | 'countdown';

export type ProgramPlayerMode = 'start' | 'video' | 'rest' | 'countdown' | 'complete';

export type ProgramPlayerViewMode = 'single' | 'display' | 'coach' | 'queue';

export interface ProgramPlayerBlock {
  id: string;
  type: ProgramPlayerBlockType;
  title: string;
  durationSec: number;
  subtitle?: string;
}

export interface ProgramPlayerMeta {
  title: string;
  totalDurationSec: number;
  totalBlocks: number;
  summary: {
    video: number;
    rest: number;
    countdown: number;
  };
  flowPreview: string;
}

export interface ProgramPlayerSnapshot {
  mode: ProgramPlayerMode;
  currentIndex: number;
  isPlaying: boolean;
  elapsedSec: number;
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
  | { type: 'JUMP_TO_BLOCK'; index: number };

export type ProgramPlayerBroadcastMessage = ProgramPlayerOutgoingMessage & {
  sourceId: string;
};
