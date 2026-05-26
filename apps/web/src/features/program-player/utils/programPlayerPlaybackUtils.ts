import type { VideoPlayMode } from '../../workout-program-builder/types/workoutProgramBuilder.types';
import type {
  ProgramPlayerBlock,
  ProgramPlayerVideoPlaybackMode,
} from '../types/programPlayer.types';

export function mapBuilderPlayModeToPlayer(
  playMode: VideoPlayMode | string | undefined,
): ProgramPlayerVideoPlaybackMode {
  if (playMode === 'repeat_count') return 'repeat_count';
  if (playMode === 'loop_until_duration') return 'loop_until_duration';
  return 'original_duration';
}

export function computePlayerVideoDurationSec(params: {
  playMode: ProgramPlayerVideoPlaybackMode;
  videoDurationSec: number;
  blockDurationSec: number;
  repeatCount?: number;
  targetDurationSec?: number;
}): { durationSec: number; singleLoopDurationSec: number } {
  const videoDur = Math.max(1, params.videoDurationSec || params.blockDurationSec || 1);
  const repeatCount = Math.max(1, params.repeatCount ?? 1);

  switch (params.playMode) {
    case 'repeat_count':
      return {
        singleLoopDurationSec: videoDur,
        durationSec: videoDur * repeatCount,
      };
    case 'loop_until_duration': {
      const target = Math.max(1, params.targetDurationSec ?? videoDur);
      return {
        singleLoopDurationSec: videoDur,
        durationSec: target,
      };
    }
    case 'original_duration':
    default:
      return {
        singleLoopDurationSec: videoDur,
        durationSec: Math.max(1, params.blockDurationSec || videoDur),
      };
  }
}

export function getPlayerBlockPlaybackHint(block: ProgramPlayerBlock): string | null {
  if (block.type !== 'video') return null;
  if (block.playbackMode === 'repeat_count') {
    return `반복 ${block.repeatCount ?? 1}회`;
  }
  if (block.playbackMode === 'loop_until_duration') {
    return `${block.targetDurationSec ?? block.durationSec}초 반복`;
  }
  if (block.playbackMode === 'original_duration') {
    return '원본 길이 재생';
  }
  return null;
}

export function shouldLoopVideo(block: ProgramPlayerBlock): boolean {
  return block.type === 'video' && block.playbackMode === 'loop_until_duration';
}

export function usesVideoEndedForAdvance(block: ProgramPlayerBlock): boolean {
  return block.type === 'video' && block.playbackMode === 'repeat_count';
}

/** After a single playthrough ends, seek back to 0 and replay (before state catches up). */
export function shouldReplayVideoAfterEnd(
  block: ProgramPlayerBlock,
  currentRepeatIndex: number,
): boolean {
  if (block.type !== 'video') return false;
  if (block.playbackMode === 'loop_until_duration') return true;
  if (block.playbackMode === 'repeat_count') {
    return currentRepeatIndex < Math.max(1, block.repeatCount ?? 1);
  }
  return false;
}

export function formatActiveRepeatProgress(
  block: ProgramPlayerBlock | null | undefined,
  currentRepeatIndex: number,
): string | null {
  if (!block || block.type !== 'video' || block.playbackMode !== 'repeat_count') {
    return null;
  }
  const total = Math.max(1, block.repeatCount ?? 1);
  if (total <= 1) return null;
  return `반복 ${currentRepeatIndex} / ${total}`;
}
