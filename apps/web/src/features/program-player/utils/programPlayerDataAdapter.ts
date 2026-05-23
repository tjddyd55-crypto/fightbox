import type { PublishedProgramShareDto, PublishedProgramPlaybackItemDto } from '@fightbox/shared';
import type { ProgramBlock, WorkoutProgramTemplate, WorkoutVideo } from '../../workout-program-builder/types/workoutProgramBuilder.types';
import {
  buildWorkoutVideoMap,
  getBlockDurationSeconds,
  getTimelineTotalDurationSeconds,
} from '../../workout-program-builder/utils/programTimelineUtils';
import type {
  ProgramPlayerBlock,
  ProgramPlayerBlockType,
  ProgramPlayerProgram,
} from '../types/programPlayer.types';
import { MOCK_PROGRAM_BLOCKS } from '../data/mockProgramPlayerData';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readString(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function readNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function resolveHttpUrl(value: string | null | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  const trimmed = value.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return undefined;
}

function mapBuilderBlockType(type: string): ProgramPlayerBlockType | null {
  if (type === 'video' || type === 'rest' || type === 'countdown') {
    return type;
  }
  return null;
}

function extractTemplateBlocks(templateJson: unknown): ProgramBlock[] {
  if (!isRecord(templateJson)) return [];
  const blocks = templateJson.blocks;
  if (!Array.isArray(blocks)) return [];
  return blocks.filter((block): block is ProgramBlock => isRecord(block) && typeof block.type === 'string');
}

function buildBlockTypeMap(templateJson: unknown): Map<string, ProgramPlayerBlockType> {
  const map = new Map<string, ProgramPlayerBlockType>();
  for (const block of extractTemplateBlocks(templateJson)) {
    const mapped = mapBuilderBlockType(block.type);
    if (mapped) {
      map.set(block.id, mapped);
    }
  }
  return map;
}

function inferBlockTypeFromPlayback(
  item: PublishedProgramPlaybackItemDto,
  typeMap: Map<string, ProgramPlayerBlockType>,
): ProgramPlayerBlockType {
  const fromTemplate = typeMap.get(item.blockId);
  if (fromTemplate) return fromTemplate;
  if (item.videoId) return 'video';
  if (item.title.includes('휴식')) return 'rest';
  if (item.title.includes('카운트')) return 'countdown';
  return 'video';
}

export function normalizeProgramBlock(
  block: ProgramBlock,
  index: number,
  videoMap: ReadonlyMap<string, WorkoutVideo>,
  playbackItem?: PublishedProgramPlaybackItemDto,
): ProgramPlayerBlock | null {
  const mappedType = mapBuilderBlockType(block.type);
  if (!mappedType) {
    return null;
  }

  const video = block.type === 'video' ? videoMap.get(block.videoId) : undefined;
  const durationSec = Math.max(
    1,
    playbackItem?.durationSec ??
      getBlockDurationSeconds(block, videoMap) ??
      video?.durationSec ??
      block.durationSec ??
      (mappedType === 'rest' ? 30 : mappedType === 'countdown' ? 10 : 10),
  );

  const playbackUrl =
    resolveHttpUrl(playbackItem?.playbackUrl) ??
    resolveHttpUrl(video?.uploadMeta?.playbackUrl) ??
    resolveHttpUrl(video?.previewUrl);

  const thumbnailUrl =
    resolveHttpUrl(playbackItem?.thumbnailUrl) ??
    resolveHttpUrl(video?.uploadMeta?.remoteThumbnailUrl) ??
    resolveHttpUrl(video?.thumbnailUrl) ??
    null;

  const nextTitle =
    block.type === 'rest'
      ? block.nextBlockTitle ?? block.message
      : undefined;

  return {
    id: block.id,
    type: mappedType,
    order: block.order ?? index + 1,
    title:
      mappedType === 'rest'
        ? readString(block.title, '휴식')
        : mappedType === 'countdown'
          ? readString(block.title, '카운트다운')
          : readString(block.title, video?.title ?? '운동 블록'),
    description: block.type === 'rest' ? block.message : undefined,
    durationSec,
    subtitle: nextTitle ? `다음 · ${nextTitle}` : undefined,
    videoId: block.type === 'video' ? block.videoId : playbackItem?.videoId,
    playbackUrl,
    thumbnailUrl,
    bodyParts: playbackItem?.bodyParts ?? video?.bodyParts,
    tags: playbackItem?.tags ?? video?.tags,
    playbackMode: block.type === 'video' ? block.playMode : undefined,
    repeatCount: block.type === 'video' ? block.repeatCount : undefined,
    targetDurationSec: block.type === 'video' ? block.targetDurationSec : undefined,
    restAfterSec: block.type === 'video' ? block.restAfterSec : undefined,
  };
}

export function programFromWorkoutTemplate(
  template: WorkoutProgramTemplate,
  videos: WorkoutVideo[] = [],
): ProgramPlayerProgram {
  const videoMap = buildWorkoutVideoMap(videos);
  const sortedBlocks = [...template.blocks].sort((a, b) => a.order - b.order);
  const blocks = sortedBlocks
    .map((block, index) => normalizeProgramBlock(block, index, videoMap))
    .filter((block): block is ProgramPlayerBlock => block !== null);

  const totalDurationSec =
    template.totalDurationSec > 0
      ? template.totalDurationSec
      : getTimelineTotalDurationSeconds(template.blocks, videoMap);

  return {
    id: template.id,
    title: template.title,
    description: template.description,
    totalDurationSec,
    blocks,
    source: 'template',
  };
}

export function programFromPublishedShare(shared: PublishedProgramShareDto): ProgramPlayerProgram {
  const typeMap = buildBlockTypeMap(shared.templateJson);
  const templateBlocks = extractTemplateBlocks(shared.templateJson);
  const playbackByBlockId = new Map(
    shared.playbackItems.map((item) => [item.blockId, item]),
  );

  if (templateBlocks.length > 0) {
    const blocks = [...templateBlocks]
      .sort((a, b) => a.order - b.order)
      .map((block, index) => {
        const playback = playbackByBlockId.get(block.id);
        const videoMap = new Map<string, WorkoutVideo>();
        return normalizeProgramBlock(block, index, videoMap, playback);
      })
      .filter((block): block is ProgramPlayerBlock => block !== null);

    return {
      id: shared.templateId,
      title: shared.title,
      description: shared.description,
      totalDurationSec: shared.totalDurationSec,
      blocks,
      source: 'share',
      shareToken: shared.id,
    };
  }

  const blocks: ProgramPlayerBlock[] = [...shared.playbackItems]
    .sort((a, b) => a.order - b.order)
    .map((item, index) => {
      const type = inferBlockTypeFromPlayback(item, typeMap);
      return {
        id: item.blockId,
        type,
        order: item.order ?? index + 1,
        title: readString(item.title, '운동 블록'),
        durationSec: readNumber(item.durationSec, type === 'rest' ? 30 : 10),
        videoId: item.videoId,
        playbackUrl: resolveHttpUrl(item.playbackUrl),
        thumbnailUrl: resolveHttpUrl(item.thumbnailUrl) ?? null,
        bodyParts: item.bodyParts,
        tags: item.tags,
      };
    });

  return {
    id: shared.templateId,
    title: shared.title,
    description: shared.description,
    totalDurationSec: shared.totalDurationSec,
    blocks,
    source: 'share',
    shareToken: shared.id,
  };
}

export function programFromMockBlocks(
  title: string,
  blocks: ProgramPlayerBlock[],
  totalDurationSec: number,
): ProgramPlayerProgram {
  return {
    id: 'mock-program',
    title,
    totalDurationSec,
    blocks,
    source: 'mock',
  };
}

export function createMockProgram(): ProgramPlayerProgram {
  const totalDurationSec = MOCK_PROGRAM_BLOCKS.reduce((sum, block) => sum + block.durationSec, 0);
  return programFromMockBlocks('전신 인터벌 프로그램', MOCK_PROGRAM_BLOCKS, totalDurationSec);
}
