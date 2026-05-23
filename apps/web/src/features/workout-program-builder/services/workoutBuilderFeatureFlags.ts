import { isApiWorkoutBuilderStorage } from './workoutBuilderStorageConfig';

function readTruthyEnv(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase();
  return normalized === 'true' || normalized === '1';
}

/** VITE_ENABLE_PROGRAM_PLAYER_DEMO — default false (mock /program-player-demo route) */
export function isProgramPlayerDemoEnabled(): boolean {
  return readTruthyEnv(import.meta.env.VITE_ENABLE_PROGRAM_PLAYER_DEMO);
}

/** VITE_ENABLE_WORKOUT_BUILDER_MOCK_DATA — default false (mock videos/templates in builder) */
export function isWorkoutBuilderMockDataEnabled(): boolean {
  return readTruthyEnv(import.meta.env.VITE_ENABLE_WORKOUT_BUILDER_MOCK_DATA);
}

/** Mock catalog is never merged when API storage mode is active. */
export function shouldUseWorkoutBuilderMockCatalog(): boolean {
  if (isApiWorkoutBuilderStorage()) {
    return false;
  }
  return isWorkoutBuilderMockDataEnabled();
}
