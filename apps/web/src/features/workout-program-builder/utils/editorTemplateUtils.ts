import { createEmptyProgramTemplate } from '../data/emptyProgramTemplate';
import { mockProgramTemplate } from '../data/mockProgramTemplate';
import { shouldUseWorkoutBuilderMockCatalog } from '../services/workoutBuilderFeatureFlags';
import type { WorkoutProgramTemplate } from '../types/workoutProgramBuilder.types';

export function createInitialEditorTemplate(): WorkoutProgramTemplate {
  if (shouldUseWorkoutBuilderMockCatalog()) {
    return {
      ...mockProgramTemplate,
      blocks: [...mockProgramTemplate.blocks],
    };
  }
  return createEmptyProgramTemplate();
}

export function getInitialActiveTemplateId(): string | null {
  return shouldUseWorkoutBuilderMockCatalog() ? mockProgramTemplate.id : null;
}

export function getInitialSelectedBlockId(template: WorkoutProgramTemplate): string | null {
  return template.blocks[0]?.id ?? null;
}
