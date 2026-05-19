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

export function getBlockSubtitle(block: ProgramBlock): string {
  switch (block.type) {
    case 'video':
      if (block.playMode === 'repeat_count') {
        return `${block.repeatCount ?? 1}회 반복`;
      }
      if (block.playMode === 'loop_until_duration') {
        return '지정 시간 반복';
      }
      return '원본 길이';
    case 'rest':
      return block.nextBlockTitle
        ? `다음 · ${block.nextBlockTitle}`
        : block.message ?? '휴식';
    case 'countdown':
      return `${block.countFromSec}초 카운트`;
    case 'voice':
      return block.cueText;
  }
}
