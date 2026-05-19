import { DEFAULT_VIDEO_VOICE_CUES } from '../constants/builderConstants';
import type {
  ProgramBlock,
  VideoPlayMode,
  VideoProgramBlock,
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
