import type { WorkoutProgramTemplate } from '../types/workoutProgramBuilder.types';

export function createEmptyProgramTemplate(): WorkoutProgramTemplate {
  const now = new Date().toISOString();
  return {
    id: '',
    title: '새 운동 프로그램',
    description: '',
    blocks: [],
    tags: [],
    totalDurationSec: 0,
    visibility: 'private',
    createdAt: now,
    updatedAt: now,
  };
}
