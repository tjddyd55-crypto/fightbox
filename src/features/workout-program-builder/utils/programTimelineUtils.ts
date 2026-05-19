import { DEFAULT_VIDEO_VOICE_CUES } from '../constants/builderConstants';
import type {
  CountdownProgramBlock,
  ProgramBlock,
  RestProgramBlock,
  VideoPlayMode,
  VideoProgramBlock,
  VoiceProgramBlock,
  WorkoutVideo,
} from '../types/workoutProgramBuilder.types';

export function calculateTotalDurationSec(blocks: ProgramBlock[]): number {
  return blocks.reduce((sum, block) => sum + block.durationSec, 0);
}

export function reorderBlocks(
  blocks: ProgramBlock[],
  activeId: string,
  overId: string,
): ProgramBlock[] {
  const oldIndex = blocks.findIndex((b) => b.id === activeId);
  const newIndex = blocks.findIndex((b) => b.id === overId);

  if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
    return blocks;
  }

  const next = [...blocks];
  const [moved] = next.splice(oldIndex, 1);
  next.splice(newIndex, 0, moved);

  return reindexBlocks(next);
}

export function reindexBlocks(blocks: ProgramBlock[]): ProgramBlock[] {
  return blocks.map((block, index) => ({
    ...block,
    order: index + 1,
  }));
}

/** Deep-enough copy with fresh block ids (for template duplicate / load isolation). */
export function cloneBlocksWithNewIds(blocks: ProgramBlock[]): ProgramBlock[] {
  const stamp = Date.now();
  return reindexBlocks(
    blocks.map((block, index) => ({
      ...block,
      id: `block_${stamp}_${index}`,
    })),
  );
}

function nextBlockId(prefix: string): string {
  return `block_${prefix}_${Date.now()}`;
}

export function cloneProgramBlock(block: ProgramBlock, newId?: string): ProgramBlock {
  const id = newId ?? nextBlockId('dup');
  if (block.type === 'video') {
    return {
      ...block,
      id,
      voiceCues: { ...block.voiceCues },
    };
  }
  return { ...block, id };
}

export function duplicateBlockInList(
  blocks: ProgramBlock[],
  blockId: string,
): { blocks: ProgramBlock[]; newBlockId: string } | null {
  const index = blocks.findIndex((b) => b.id === blockId);
  if (index < 0) return null;

  const clone = cloneProgramBlock(blocks[index]);
  const next = [...blocks];
  next.splice(index + 1, 0, clone);
  return { blocks: reindexBlocks(next), newBlockId: clone.id };
}

export function createRestBlock(order: number, durationSec = 30): RestProgramBlock {
  return {
    id: nextBlockId('rest'),
    type: 'rest',
    title: `휴식 ${durationSec}초`,
    order,
    durationSec,
    message: '휴식 중입니다',
  };
}

export function createCountdownBlock(order: number, durationSec = 10): CountdownProgramBlock {
  return {
    id: nextBlockId('countdown'),
    type: 'countdown',
    title: `카운트다운 ${durationSec}초`,
    order,
    durationSec,
    countFromSec: durationSec,
  };
}

export function createVoiceBlock(order: number, message = '준비하세요'): VoiceProgramBlock {
  return {
    id: nextBlockId('voice'),
    type: 'voice',
    title: message,
    order,
    durationSec: 3,
    cueText: message,
  };
}

export function createVideoBlockFromWorkout(
  video: WorkoutVideo,
  order: number,
): VideoProgramBlock {
  return {
    id: `block_${video.id}_${Date.now()}`,
    type: 'video',
    title: video.title,
    order,
    durationSec: video.durationSec,
    videoId: video.id,
    playMode: 'original_duration',
    restAfterSec: 0,
    voiceCues: { ...DEFAULT_VIDEO_VOICE_CUES },
  };
}

export function computeVideoBlockDuration(
  video: WorkoutVideo,
  playMode: VideoPlayMode,
  repeatCount?: number,
  targetDurationSec?: number,
): number {
  switch (playMode) {
    case 'repeat_count':
      return video.durationSec * Math.max(1, repeatCount ?? 1);
    case 'loop_until_duration':
      return Math.max(video.durationSec, targetDurationSec ?? video.durationSec);
    case 'original_duration':
    default:
      return video.durationSec;
  }
}

export function getVideoById(
  videos: WorkoutVideo[],
  videoId: string,
): WorkoutVideo | undefined {
  return videos.find((v) => v.id === videoId);
}

export function getAllTags(videos: WorkoutVideo[]): string[] {
  const tagSet = new Set<string>();
  videos.forEach((v) => v.tags.forEach((t) => tagSet.add(t)));
  return Array.from(tagSet).sort();
}
