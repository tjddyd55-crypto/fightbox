export type WorkoutBuilderStorageMode = 'local' | 'api';

const DEFAULT_STORAGE_MODE: WorkoutBuilderStorageMode = 'local';

export function resolveWorkoutBuilderStorage(): WorkoutBuilderStorageMode {
  const raw = import.meta.env.VITE_WORKOUT_BUILDER_STORAGE?.trim().toLowerCase();
  if (raw === 'api') {
    return 'api';
  }
  return DEFAULT_STORAGE_MODE;
}

export function isApiWorkoutBuilderStorage(): boolean {
  return resolveWorkoutBuilderStorage() === 'api';
}

export const DEFAULT_GYM_ID = 'demo-gym';
export const DEFAULT_ACTOR_ID = 'demo-coach';
