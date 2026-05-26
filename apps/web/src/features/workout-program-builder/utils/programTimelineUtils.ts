import { DEFAULT_VIDEO_VOICE_CUES } from '../constants/builderConstants';
import { getBlockSubtitle } from './blockDisplayUtils';
import type {
  CountdownProgramBlock,
  ProgramBlock,
  RestProgramBlock,
  VideoPlayMode,
  VideoProgramBlock,
  VoiceProgramBlock,
  WorkoutVideo,
} from '../types/workoutProgramBuilder.types';

export type WorkoutVideoMap = ReadonlyMap<string, WorkoutVideo>;

/**
 * Duration policy:
 * - Timeline row / block card: play time only (`getBlockDurationSeconds`).
 * - Program total, test playback, saved template total: play + video `restAfterSec`
 *   (`getBlockTimelineContributionSeconds` / `getTimelineTotalDurationSeconds`).
 * - Voice blocks: `durationSec` (default 3s when created).
 */
export function buildWorkoutVideoMap(videos: WorkoutVideo[]): WorkoutVideoMap {
  return new Map(videos.map((video) => [video.id, video]));
}

export function getBlockDurationSeconds(
  block: ProgramBlock,
  videoMap: WorkoutVideoMap,
): number {
  switch (block.type) {
    case 'video': {
      const video = videoMap.get(block.videoId);
      if (!video) {
        return Math.max(0, block.durationSec);
      }
      return computeVideoBlockDuration(
        video,
        block.playMode,
        block.repeatCount,
        block.targetDurationSec,
      );
    }
    case 'rest':
    case 'countdown':
    case 'voice':
      return Math.max(0, block.durationSec);
  }
}

export function getBlockRestAfterSeconds(block: ProgramBlock): number {
  if (block.type !== 'video') {
    return 0;
  }
  return Math.max(0, block.restAfterSec ?? 0);
}

export function getBlockTimelineContributionSeconds(
  block: ProgramBlock,
  videoMap: WorkoutVideoMap,
): number {
  return getBlockDurationSeconds(block, videoMap) + getBlockRestAfterSeconds(block);
}

export function getTimelineTotalDurationSeconds(
  blocks: ProgramBlock[],
  videoMap: WorkoutVideoMap,
): number {
  return blocks.reduce(
    (sum, block) => sum + getBlockTimelineContributionSeconds(block, videoMap),
    0,
  );
}

export function getElapsedTimelineSecondsBeforeIndex(
  blocks: ProgramBlock[],
  videoMap: WorkoutVideoMap,
  index: number,
): number {
  return blocks
    .slice(0, index)
    .reduce((sum, block) => sum + getBlockTimelineContributionSeconds(block, videoMap), 0);
}

export function getBlockPlaybackLabel(block: ProgramBlock): string {
  return getBlockSubtitle(block);
}

/** @deprecated Prefer `getTimelineTotalDurationSeconds` with a video map. */
export function calculateTotalDurationSec(
  blocks: ProgramBlock[],
  videos?: WorkoutVideo[],
): number {
  if (videos?.length) {
    return getTimelineTotalDurationSeconds(blocks, buildWorkoutVideoMap(videos));
  }
  return blocks.reduce(
    (sum, block) => sum + block.durationSec + getBlockRestAfterSeconds(block),
    0,
  );
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
    title: '휴식',
    order,
    durationSec,
    message: '잠시 쉬세요',
  };
}

export function createCountdownBlock(order: number, durationSec = 10): CountdownProgramBlock {
  return {
    id: nextBlockId('countdown'),
    type: 'countdown',
    title: '카운트다운',
    order,
    durationSec,
    countFromSec: durationSec,
    message: '준비하세요',
  };
}

export function createVoiceBlock(order: number, message = '준비하세요'): VoiceProgramBlock {
  return {
    id: nextBlockId('voice'),
    type: 'voice',
    title: '음성 안내',
    order,
    durationSec: 3,
    cueText: message,
    message,
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
    repeatCount: 1,
    targetDurationSec: video.durationSec,
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
