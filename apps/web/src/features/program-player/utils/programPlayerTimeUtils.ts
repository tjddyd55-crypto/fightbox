import { formatDuration } from '../../workout-program-builder/utils/durationUtils';
import type { ProgramPlayerBlock } from '../types/programPlayer.types';

const DEFAULT_REST_DURATION_SEC = 30;
const DEFAULT_COUNTDOWN_DURATION_SEC = 10;
const DEFAULT_VOICE_DURATION_SEC = 3;

export function getProgramBlockDurationSec(
  block: Pick<ProgramPlayerBlock, 'type' | 'durationSec' | 'targetDurationSec'>,
): number {
  if (Number.isFinite(block.durationSec) && block.durationSec > 0) {
    return Math.floor(block.durationSec);
  }

  if (block.type === 'rest') {
    return DEFAULT_REST_DURATION_SEC;
  }

  if (block.type === 'countdown') {
    return DEFAULT_COUNTDOWN_DURATION_SEC;
  }

  if (block.type === 'voice') {
    return DEFAULT_VOICE_DURATION_SEC;
  }

  if (block.type === 'video') {
    if (Number.isFinite(block.targetDurationSec) && (block.targetDurationSec ?? 0) > 0) {
      return Math.floor(block.targetDurationSec as number);
    }
    return 10;
  }

  return 10;
}

export function getProgramTotalDurationSec(blocks: ProgramPlayerBlock[]): number {
  return blocks.reduce((sum, block) => sum + getProgramBlockDurationSec(block), 0);
}

export function formatPlayerTime(totalSec: number): string {
  return formatDuration(totalSec);
}
