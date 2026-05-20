import type { WorkoutVideo } from '../types/workoutProgramBuilder.types';

/** User-registered videos stored in localStorage (not mock catalog). */
export function isUploadedVideo(video: WorkoutVideo): boolean {
  return Boolean(video.uploadMeta);
}
