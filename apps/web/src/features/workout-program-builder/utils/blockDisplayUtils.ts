import type { ProgramBlock } from '../types/workoutProgramBuilder.types';

export const BLOCK_TYPE_LABEL: Record<ProgramBlock['type'], string> = {
  video: '영상',
  rest: '휴식',
  countdown: '카운트다운',
  voice: '음성',
};

export function getBlockTypeIcon(block: ProgramBlock): string {
  if (block.type === 'video') {
    if (block.playMode === 'loop_until_duration' || block.playMode === 'repeat_count') {
      return '⟳';
    }
    return '▶';
  }
  if (block.type === 'rest') return '◌';
  if (block.type === 'countdown') return '⏱';
  return '♪';
}

function restAfterSuffix(restAfterSec?: number): string {
  if (!restAfterSec || restAfterSec <= 0) return '';
  return ` · 휴식 ${restAfterSec}초`;
}

export function getBlockSubtitle(block: ProgramBlock): string {
  switch (block.type) {
    case 'video':
      if (block.playMode === 'repeat_count') {
        return `${block.repeatCount ?? 1}회 반복${restAfterSuffix(block.restAfterSec)}`;
      }
      if (block.playMode === 'loop_until_duration') {
        const target = block.targetDurationSec ?? block.durationSec;
        return `지정 ${target}초 반복${restAfterSuffix(block.restAfterSec)}`;
      }
      return `원본 길이 재생${restAfterSuffix(block.restAfterSec)}`;
    case 'rest':
      return block.nextBlockTitle
        ? `다음 · ${block.nextBlockTitle}`
        : block.message ?? '휴식';
    case 'countdown':
      return block.message
        ? `${block.message} · ${block.countFromSec}초`
        : `${block.countFromSec}초 카운트`;
    case 'voice':
      return block.message ?? block.cueText;
  }
}
