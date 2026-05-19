/**
 * Workout video data access layer.
 * Swap `mockWorkoutVideos` for API list/search when the backend is ready.
 */
import { mockWorkoutVideos } from '../data/mockWorkoutVideos';
import type { WorkoutVideo } from '../types/workoutProgramBuilder.types';
import {
  filterWorkoutVideos,
  type VideoLibraryFilters,
} from '../utils/videoFilterUtils';

export function listVideos(): WorkoutVideo[] {
  return mockWorkoutVideos;
}

export function getVideo(id: string): WorkoutVideo | undefined {
  return mockWorkoutVideos.find((video) => video.id === id);
}

export function filterVideos(
  filters: VideoLibraryFilters,
  videos: WorkoutVideo[] = listVideos(),
): WorkoutVideo[] {
  return filterWorkoutVideos(videos, filters);
}
