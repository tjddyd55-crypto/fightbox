import type { ProgramBlock, WorkoutVideo } from '../types/workoutProgramBuilder.types';
import {
  buildWorkoutVideoMap,
  getBlockDurationSeconds,
  getTimelineTotalDurationSeconds,
} from './programTimelineUtils';

export type ProgramValidationSeverity = 'error' | 'warning';

export interface ProgramValidationIssue {
  severity: ProgramValidationSeverity;
  message: string;
  blockId?: string;
}

export interface ProgramValidationResult {
  errors: ProgramValidationIssue[];
  warnings: ProgramValidationIssue[];
  isValid: boolean;
}

const MIN_PROGRAM_DURATION_SEC = 5 * 60;
const MAX_PROGRAM_DURATION_SEC = 3 * 60 * 60;

export function validateProgramBlocks(
  blocks: ProgramBlock[],
  videos: WorkoutVideo[],
): ProgramValidationResult {
  const errors: ProgramValidationIssue[] = [];
  const warnings: ProgramValidationIssue[] = [];
  const videoMap = buildWorkoutVideoMap(videos);

  if (blocks.length === 0) {
    errors.push({
      severity: 'error',
      message: '타임라인에 블록이 1개 이상 필요합니다.',
    });
  }

  blocks.forEach((block) => {
    const playSec = getBlockDurationSeconds(block, videoMap);

    if (playSec < 1) {
      errors.push({
        severity: 'error',
        message: `「${block.title}」 블록 시간이 1초 미만입니다.`,
        blockId: block.id,
      });
    }

    if (block.type === 'video') {
      if (!videoMap.has(block.videoId)) {
        errors.push({
          severity: 'error',
          message: `「${block.title}」 영상을 찾을 수 없습니다.`,
          blockId: block.id,
        });
      }
      if (block.playMode === 'repeat_count' && (block.repeatCount ?? 0) < 1) {
        errors.push({
          severity: 'error',
          message: `「${block.title}」 반복 횟수는 1 이상이어야 합니다.`,
          blockId: block.id,
        });
      }
      if (
        block.playMode === 'loop_until_duration' &&
        (block.targetDurationSec ?? 0) < 1
      ) {
        errors.push({
          severity: 'error',
          message: `「${block.title}」 지정 시간은 1초 이상이어야 합니다.`,
          blockId: block.id,
        });
      }
    }
  });

  const totalSec = getTimelineTotalDurationSeconds(blocks, videoMap);
  if (totalSec < MIN_PROGRAM_DURATION_SEC) {
    warnings.push({
      severity: 'warning',
      message: '전체 프로그램이 5분 미만입니다. 의도한 길이인지 확인해 주세요.',
    });
  }
  if (totalSec > MAX_PROGRAM_DURATION_SEC) {
    warnings.push({
      severity: 'warning',
      message: '전체 프로그램이 3시간을 초과합니다. 회원 수업 길이에 맞는지 확인해 주세요.',
    });
  }

  return {
    errors,
    warnings,
    isValid: errors.length === 0,
  };
}

export function formatValidationSummary(result: ProgramValidationResult): string {
  if (!result.isValid) {
    return result.errors[0]?.message ?? '프로그램을 검증할 수 없습니다.';
  }
  return result.warnings[0]?.message ?? '';
}
