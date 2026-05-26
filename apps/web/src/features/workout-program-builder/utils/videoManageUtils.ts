import type { WorkoutVideo } from '../types/workoutProgramBuilder.types';
import { isUploadedR2WorkoutVideo, isYouTubeWorkoutVideo } from './videoPlaybackUtils';

export { isYouTubeWorkoutVideo };

/** User-registered videos in the library (R2 upload or YouTube link). */
export function isUploadedVideo(video: WorkoutVideo): boolean {
  return isUploadedR2WorkoutVideo(video) || isYouTubeWorkoutVideo(video);
}

/** R2-backed upload with storage key (excludes YouTube links). */
export function isR2UploadedVideo(video: WorkoutVideo): boolean {
  return isUploadedR2WorkoutVideo(video);
}
