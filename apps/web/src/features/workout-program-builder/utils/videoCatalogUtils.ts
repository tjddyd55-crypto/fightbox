import { mockWorkoutVideos } from '../data/mockWorkoutVideos';
import { shouldUseWorkoutBuilderMockCatalog } from '../services/workoutBuilderFeatureFlags';
import { getUploadedVideos } from '../storage/uploadedVideoStorage';
import type { WorkoutVideo } from '../types/workoutProgramBuilder.types';

export function getCatalogVideos(): WorkoutVideo[] {
  if (!shouldUseWorkoutBuilderMockCatalog()) {
    return getUploadedVideos();
  }

  const mockIds = new Set(mockWorkoutVideos.map((video) => video.id));
  const uploaded = getUploadedVideos().filter((video) => !mockIds.has(video.id));
  return [...mockWorkoutVideos, ...uploaded];
}
