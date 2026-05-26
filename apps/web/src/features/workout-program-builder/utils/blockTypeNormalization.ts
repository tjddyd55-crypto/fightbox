import { DEFAULT_VIDEO_VOICE_CUES } from '../constants/builderConstants';
import type {
  CountdownProgramBlock,
  ProgramBlock,
  ProgramBlockType,
  RestProgramBlock,
  VideoPlayMode,
  VideoProgramBlock,
  VoiceProgramBlock,
  WorkoutProgramTemplate,
} from '../types/workoutProgramBuilder.types';
import { computeVideoBlockDuration } from './programTimelineUtils';
import type { WorkoutVideoMap } from './programTimelineUtils';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

function readNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/** Legacy / alternate type names from drafts or external JSON. */
function normalizeBlockType(raw: unknown): ProgramBlockType | null {
  const type = readString(raw).toLowerCase();
  if (type === 'video' || type === 'rest' || type === 'countdown' || type === 'voice') {
    return type;
  }
  if (type === 'voiceguide' || type === 'audioguide' || type === 'audio') {
    return 'voice';
  }
  return null;
}

/** Maps playbackMode aliases to builder playMode. */
function normalizePlayMode(raw: unknown, legacyPlaybackMode?: unknown): VideoPlayMode {
  const mode = readString(raw) || readString(legacyPlaybackMode);
  if (mode === 'repeat_count' || mode === 'repeatcount') {
    return 'repeat_count';
  }
  if (
    mode === 'loop_until_duration' ||
    mode === 'fixedduration' ||
    mode === 'fixed_duration'
  ) {
    return 'loop_until_duration';
  }
  if (mode === 'original_duration' || mode === 'original') {
    return 'original_duration';
  }
  return 'original_duration';
}

function normalizeVoiceCues(raw: unknown): VideoProgramBlock['voiceCues'] {
  if (!isRecord(raw)) {
    return { ...DEFAULT_VIDEO_VOICE_CUES };
  }
  return {
    ready: readBoolean(raw.ready, DEFAULT_VIDEO_VOICE_CUES.ready),
    go: readBoolean(raw.go, DEFAULT_VIDEO_VOICE_CUES.go),
    stop: readBoolean(raw.stop, DEFAULT_VIDEO_VOICE_CUES.stop),
    lastTenCount: readBoolean(raw.lastTenCount, DEFAULT_VIDEO_VOICE_CUES.lastTenCount),
  };
}

function normalizeVideoBlock(
  raw: Record<string, unknown>,
  order: number,
  videoMap: WorkoutVideoMap,
): VideoProgramBlock {
  const videoId = readString(raw.videoId);
  const video = videoMap.get(videoId);
  const playMode = normalizePlayMode(raw.playMode, raw.playbackMode);
  const repeatCount = Math.max(1, readNumber(raw.repeatCount, 1));
  const targetDurationSec = readNumber(
    raw.targetDurationSec,
    video?.durationSec ?? readNumber(raw.durationSec, 60),
  );
  const restAfterSec = readNumber(raw.restAfterSec, 0);

  const durationSec =
    video != null
      ? computeVideoBlockDuration(video, playMode, repeatCount, targetDurationSec)
      : readNumber(raw.durationSec, 0);

  return {
    id: readString(raw.id, `block_video_${order}`),
    type: 'video',
    title: readString(raw.title, video?.title ?? '영상 블록'),
    order,
    durationSec,
    videoId,
    playMode,
    repeatCount: playMode === 'repeat_count' ? repeatCount : undefined,
    targetDurationSec:
      playMode === 'loop_until_duration' ? targetDurationSec : undefined,
    restAfterSec,
    voiceCues: normalizeVoiceCues(raw.voiceCues),
  };
}

function normalizeRestBlock(raw: Record<string, unknown>, order: number): RestProgramBlock {
  const durationSec = Math.max(1, readNumber(raw.durationSec, 30));
  const message = readString(raw.message, '잠시 쉬세요');
  return {
    id: readString(raw.id, `block_rest_${order}`),
    type: 'rest',
    title: readString(raw.title, '휴식'),
    order,
    durationSec,
    message,
    nextBlockTitle: readString(raw.nextBlockTitle) || undefined,
  };
}

function normalizeCountdownBlock(
  raw: Record<string, unknown>,
  order: number,
): CountdownProgramBlock {
  const countFromSec = Math.max(
    1,
    readNumber(raw.countFromSec, readNumber(raw.durationSec, 10)),
  );
  const durationSec = Math.max(1, readNumber(raw.durationSec, countFromSec));
  const message = readString(raw.message, '준비하세요');
  return {
    id: readString(raw.id, `block_countdown_${order}`),
    type: 'countdown',
    title: readString(raw.title, '카운트다운'),
    order,
    durationSec,
    countFromSec,
    message,
    startNumber:
      typeof raw.startNumber === 'number' && raw.startNumber > 0
        ? Math.floor(raw.startNumber)
        : undefined,
  };
}

function normalizeVoiceBlock(raw: Record<string, unknown>, order: number): VoiceProgramBlock {
  const message =
    readString(raw.message) ||
    readString(raw.cueText) ||
    '준비하세요';
  const durationSec = Math.max(1, readNumber(raw.durationSec, 3));
  return {
    id: readString(raw.id, `block_voice_${order}`),
    type: 'voice',
    title: readString(raw.title, '음성 안내'),
    order,
    durationSec,
    cueText: message,
    message,
    voiceCue: readString(raw.voiceCue) || undefined,
  };
}

export function normalizeProgramBlock(
  raw: unknown,
  order: number,
  videoMap: WorkoutVideoMap = new Map(),
): ProgramBlock | null {
  if (!isRecord(raw)) {
    return null;
  }

  const type = normalizeBlockType(raw.type);
  if (!type) {
    return null;
  }

  switch (type) {
    case 'video':
      return normalizeVideoBlock(raw, order, videoMap);
    case 'rest':
      return normalizeRestBlock(raw, order);
    case 'countdown':
      return normalizeCountdownBlock(raw, order);
    case 'voice':
      return normalizeVoiceBlock(raw, order);
    default:
      return null;
  }
}

export function normalizeProgramBlocks(
  blocks: unknown,
  videoMap: WorkoutVideoMap = new Map(),
): ProgramBlock[] {
  if (!Array.isArray(blocks)) {
    return [];
  }

  return blocks
    .map((raw, index) => normalizeProgramBlock(raw, index + 1, videoMap))
    .filter((block): block is ProgramBlock => block !== null);
}

export function normalizeWorkoutProgramTemplate(
  template: WorkoutProgramTemplate,
  videoMap: WorkoutVideoMap = new Map(),
): WorkoutProgramTemplate {
  const blocks = normalizeProgramBlocks(template.blocks, videoMap);
  return {
    ...template,
    blocks,
  };
}
