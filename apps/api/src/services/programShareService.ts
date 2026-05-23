import type {
  PublishedProgramPlaybackItemDto,
  PublishedProgramShareDto,
} from '@fightbox/shared';
import { findSharedProgramByToken } from '../repositories/programTemplateRepository.js';
import { listUploadedVideosByIds } from '../repositories/workoutVideoRepository.js';

interface TemplateBlockLike {
  id?: unknown;
  type?: unknown;
  title?: unknown;
  order?: unknown;
  durationSec?: unknown;
  videoId?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function readNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function extractBlocks(templateJson: unknown): TemplateBlockLike[] {
  if (!isRecord(templateJson)) {
    return [];
  }

  const blocks = templateJson.blocks;
  if (!Array.isArray(blocks)) {
    return [];
  }

  return blocks.filter((block) => isRecord(block)) as TemplateBlockLike[];
}

function resolveHttpUrl(value: string | null | undefined): string | undefined {
  if (!value?.trim()) {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return undefined;
}

export async function getPublishedProgramByShareToken(
  shareToken: string,
): Promise<PublishedProgramShareDto | null> {
  const template = await findSharedProgramByToken(shareToken);
  if (!template || !template.publishedAt) {
    return null;
  }

  const blocks = extractBlocks(template.templateJson);
  const videoIds = blocks
    .filter((block) => block.type === 'video' && typeof block.videoId === 'string')
    .map((block) => block.videoId as string);

  const videos = await listUploadedVideosByIds(template.gymId, videoIds);
  const videoById = new Map(videos.map((video) => [video.id, video]));

  const playbackItems: PublishedProgramPlaybackItemDto[] = blocks.map((block, index) => {
    const blockId = readString(block.id, `block-${index + 1}`);
    const title = readString(block.title, '운동 블록');
    const durationSec = readNumber(block.durationSec, 0);
    const order = readNumber(block.order, index + 1);

    if (block.type !== 'video' || typeof block.videoId !== 'string') {
      return {
        blockId,
        title,
        durationSec,
        order,
      };
    }

    const video = videoById.get(block.videoId);
    return {
      blockId,
      videoId: block.videoId,
      title: video?.title || title,
      durationSec: video?.durationSec ?? durationSec,
      order,
      playbackUrl: resolveHttpUrl(video?.playbackUrl),
      thumbnailUrl: resolveHttpUrl(video?.thumbnailUrl) ?? null,
      bodyParts: video?.bodyParts ?? [],
      tags: video?.tags ?? [],
    };
  });

  return {
    id: template.id,
    templateId: template.id,
    title: template.title,
    description: template.description,
    gymId: template.gymId,
    totalDurationSec: template.totalDurationSec,
    templateJson: template.templateJson,
    playbackItems,
    publishedAt: template.publishedAt,
  };
}
