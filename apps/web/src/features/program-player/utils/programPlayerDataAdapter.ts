import type { PublishedProgramShareDto, PublishedProgramPlaybackItemDto } from '@fightbox/shared';
import type { ProgramBlock, WorkoutProgramTemplate, WorkoutVideo } from '../../workout-program-builder/types/workoutProgramBuilder.types';
import { normalizeProgramBlock as normalizeBuilderBlock } from '../../workout-program-builder/utils/blockTypeNormalization';
import {
  buildWorkoutVideoMap,
  computeVideoBlockDuration,
} from '../../workout-program-builder/utils/programTimelineUtils';
import type {
  ProgramPlayerBlock,
  ProgramPlayerBlockType,
  ProgramPlayerProgram,
} from '../types/programPlayer.types';
import {
  computePlayerVideoDurationSec,
  mapBuilderPlayModeToPlayer,
} from './programPlayerPlaybackUtils';
import { getProgramTotalDurationSec } from './programPlayerTimeUtils';
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
  if (type === 'video' || type === 'rest' || type === 'countdown' || type === 'voice') {
    return type;
  }
  if (type === 'voiceGuide' || type === 'audioGuide' || type === 'audio') {
    return 'voice';
  }
  return null;
}

function extractTemplateBlocks(templateJson: unknown): ProgramBlock[] {
  if (!isRecord(templateJson)) return [];
  const blocks = templateJson.blocks;
  if (!Array.isArray(blocks)) return [];
  return blocks
    .map((raw, index) => {
      if (isRecord(raw) && typeof raw.type === 'string') {
        return normalizeBuilderBlock(raw, index + 1) ?? (raw as unknown as ProgramBlock);
      }
      return null;
    })
    .filter((block): block is ProgramBlock => block !== null);
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
  if (item.title.includes('카운트') || item.title.includes('준비')) return 'countdown';
  if (item.title.includes('음성')) return 'voice';
  return 'video';
}

export function mapProgramBlockToPlayer(
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
  const playbackMode =
    block.type === 'video' ? mapBuilderPlayModeToPlayer(block.playMode) : undefined;

  let durationSec = 0;
  let singleLoopDurationSec: number | undefined;

  if (block.type === 'video') {
    const videoDur = video?.durationSec ?? block.durationSec;
    const computed = computePlayerVideoDurationSec({
      playMode: playbackMode ?? 'original_duration',
      videoDurationSec: videoDur,
      blockDurationSec: block.durationSec,
      repeatCount: block.repeatCount,
      targetDurationSec: block.targetDurationSec,
    });
    durationSec = video
      ? computeVideoBlockDuration(
          video,
          block.playMode,
          block.repeatCount,
          block.targetDurationSec,
        )
      : computed.durationSec;
    if (playbackItem?.durationSec && playbackMode === 'original_duration') {
      durationSec = readNumber(playbackItem.durationSec, durationSec);
    }
    singleLoopDurationSec = computed.singleLoopDurationSec;
  } else if (block.type === 'rest') {
    durationSec = Math.max(1, block.durationSec || 30);
  } else if (block.type === 'countdown') {
    durationSec = Math.max(1, block.durationSec || block.countFromSec || 10);
  } else if (block.type === 'voice') {
    durationSec = Math.max(1, block.durationSec || 3);
  }

  const playbackUrl =
    resolveHttpUrl(playbackItem?.playbackUrl) ??
    resolveHttpUrl(block.type === 'video' ? block.playbackUrl : undefined) ??
    resolveHttpUrl(video?.uploadMeta?.playbackUrl) ??
    resolveHttpUrl(video?.previewUrl);

  const thumbnailUrl =
    resolveHttpUrl(playbackItem?.thumbnailUrl) ??
    resolveHttpUrl(block.type === 'video' ? block.thumbnailUrl : undefined) ??
    resolveHttpUrl(video?.uploadMeta?.remoteThumbnailUrl) ??
    resolveHttpUrl(video?.thumbnailUrl) ??
    null;

  const message =
    block.type === 'rest'
      ? block.message
      : block.type === 'countdown'
        ? block.message
        : block.type === 'voice'
          ? block.message ?? block.cueText
          : undefined;

  const nextTitle =
    block.type === 'rest'
      ? block.nextBlockTitle ?? block.message
      : undefined;

  return {
    id: block.id,
    type: mappedType,
    order: block.order ?? index + 1,
    title: readString(
      block.title,
      mappedType === 'rest'
        ? '휴식'
        : mappedType === 'countdown'
          ? '카운트다운'
          : mappedType === 'voice'
            ? '음성 안내'
            : '운동 블록',
    ),
    message,
    description: message,
    durationSec,
    singleLoopDurationSec,
    subtitle: nextTitle ? `다음 · ${nextTitle}` : undefined,
    videoId: block.type === 'video' ? block.videoId : playbackItem?.videoId,
    playbackUrl,
    thumbnailUrl,
    bodyParts: playbackItem?.bodyParts ?? video?.bodyParts,
    tags: playbackItem?.tags ?? video?.tags,
    playbackMode,
    repeatCount: block.type === 'video' ? block.repeatCount : undefined,
    targetDurationSec: block.type === 'video' ? block.targetDurationSec : undefined,
    restAfterSec: block.type === 'video' ? block.restAfterSec : undefined,
  };
}

/** @deprecated Use mapProgramBlockToPlayer */
export const normalizeProgramBlock = mapProgramBlockToPlayer;

export function programFromWorkoutTemplate(
  template: WorkoutProgramTemplate,
  videos: WorkoutVideo[] = [],
): ProgramPlayerProgram {
  const videoMap = buildWorkoutVideoMap(videos);
  const sortedBlocks = [...template.blocks]
    .map((block, index) => normalizeBuilderBlock(block, index + 1, videoMap) ?? block)
    .sort((a, b) => a.order - b.order);
  const blocks = sortedBlocks
    .map((block, index) => mapProgramBlockToPlayer(block, index, videoMap))
    .filter((block): block is ProgramPlayerBlock => block !== null);

  const totalDurationSec =
    template.totalDurationSec > 0
      ? template.totalDurationSec
      : getProgramTotalDurationSec(blocks);

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
    const videoMap = buildWorkoutVideoMap([]);
    const blocks = [...templateBlocks]
      .sort((a, b) => a.order - b.order)
      .map((block, index) => {
        const playback = playbackByBlockId.get(block.id);
        return mapProgramBlockToPlayer(block, index, videoMap, playback);
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
      const durationSec = readNumber(item.durationSec, 0);
      return {
        id: item.blockId,
        type,
        order: item.order ?? index + 1,
        title: readString(item.title, '운동 블록'),
        durationSec:
          durationSec > 0
            ? durationSec
            : type === 'rest'
              ? 30
              : type === 'countdown'
                ? 10
                : type === 'voice'
                  ? 3
                  : 10,
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
