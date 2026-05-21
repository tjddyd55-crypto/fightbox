/**
 * Workout video data access layer.
 * Merges mock catalog with user-registered metadata from localStorage.
 * When VITE_WORKOUT_BUILDER_STORAGE=api, syncs with the API and keeps localStorage as fallback cache.
 */
import {
  UPLOADED_VIDEO_PLACEHOLDER_THUMBNAIL,
} from '../constants/builderConstants';
import { mockWorkoutVideos } from '../data/mockWorkoutVideos';
import {
  createUploadedVideoApi,
  deleteUploadedVideoApi,
  fetchUploadedVideos,
  upsertUploadedVideoApi,
  uploadedVideoDtoToWorkoutVideo,
  workoutVideoToCreateRequest,
  WorkoutBuilderApiError,
} from '../services/workoutBuilderApiClient';
import {
  isApiWorkoutBuilderStorage,
  reportWorkoutBuilderSyncError,
} from '../services/workoutBuilderStorageConfig';
import {
  deleteUploadedVideo,
  getUploadedVideos,
  replaceUploadedVideos,
  saveUploadedVideo,
  updateUploadedVideo,
} from '../storage/uploadedVideoStorage';
import type {
  CreateWorkoutVideoInput,
  UpdateWorkoutVideoInput,
  WorkoutVideo,
  WorkoutVideoUploadMeta,
} from '../types/workoutProgramBuilder.types';
import { isUploadedVideo } from '../utils/videoManageUtils';
import {
  filterWorkoutVideos,
  type VideoLibraryFilters,
} from '../utils/videoFilterUtils';

function mergeVideos(): WorkoutVideo[] {
  const mockIds = new Set(mockWorkoutVideos.map((video) => video.id));
  const uploaded = getUploadedVideos().filter((video) => !mockIds.has(video.id));
  return [...mockWorkoutVideos, ...uploaded];
}

function createVideoId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `upload_${crypto.randomUUID()}`;
  }
  return `upload_${Date.now()}`;
}

function isPersistableRemoteUrl(url: string | undefined): url is string {
  if (!url) return false;
  return !url.startsWith('blob:');
}

function buildUploadMeta(
  input: CreateWorkoutVideoInput,
  uploadResult: CreateWorkoutVideoInput['uploadResult'],
): WorkoutVideoUploadMeta {
  const uploadedAt = uploadResult?.uploadedAt ?? new Date().toISOString();
  const meta: WorkoutVideoUploadMeta = {
    originalFileName: uploadResult?.fileName ?? input.originalFileName,
    fileSizeBytes: uploadResult?.fileSize ?? input.fileSizeBytes,
    mimeType: uploadResult?.contentType ?? input.mimeType,
    uploadedAt,
  };

  if (uploadResult) {
    meta.storageKey = uploadResult.storageKey;
    meta.provider = uploadResult.provider;
    if (isPersistableRemoteUrl(uploadResult.playbackUrl)) {
      meta.playbackUrl = uploadResult.playbackUrl;
    }
    if (isPersistableRemoteUrl(uploadResult.thumbnailUrl)) {
      meta.remoteThumbnailUrl = uploadResult.thumbnailUrl;
    }
  }

  return meta;
}

function mapVisibilityToSourceType(
  visibility: CreateWorkoutVideoInput['visibility'],
): WorkoutVideo['sourceType'] {
  return visibility === 'gym_only' ? 'gym' : 'private';
}

function reportSyncError(action: string, error: unknown): void {
  if (error instanceof WorkoutBuilderApiError) {
    reportWorkoutBuilderSyncError(`${action} 실패: ${error.message}`);
    return;
  }
  if (error instanceof Error) {
    reportWorkoutBuilderSyncError(`${action} 실패: ${error.message}`);
    return;
  }
  reportWorkoutBuilderSyncError(`${action} 실패: 알 수 없는 오류`);
}

function mergeApiVideosWithLocalCache(apiVideos: WorkoutVideo[]): WorkoutVideo[] {
  const apiIds = new Set(apiVideos.map((video) => video.id));
  const localPending = getUploadedVideos().filter((video) => !apiIds.has(video.id));
  return [...apiVideos, ...localPending];
}

function syncCreateVideoToApi(video: WorkoutVideo): void {
  if (!isApiWorkoutBuilderStorage() || !isUploadedVideo(video)) {
    return;
  }

  void createUploadedVideoApi(workoutVideoToCreateRequest(video)).catch((error) => {
    reportSyncError('영상 API 저장', error);
  });
}

function syncUpdateVideoToApi(video: WorkoutVideo): void {
  if (!isApiWorkoutBuilderStorage() || !isUploadedVideo(video)) {
    return;
  }

  void upsertUploadedVideoApi(video).catch((error) => {
    reportSyncError('영상 API 수정', error);
  });
}

function syncDeleteVideoToApi(id: string): void {
  if (!isApiWorkoutBuilderStorage()) {
    return;
  }

  void deleteUploadedVideoApi(id).catch((error) => {
    reportSyncError('영상 API 삭제', error);
  });
}

export function listVideos(): WorkoutVideo[] {
  return mergeVideos();
}

export async function refreshVideosFromApi(): Promise<WorkoutVideo[]> {
  if (!isApiWorkoutBuilderStorage()) {
    return listVideos();
  }

  try {
    const dtos = await fetchUploadedVideos();
    const apiVideos = dtos.map(uploadedVideoDtoToWorkoutVideo);
    replaceUploadedVideos(mergeApiVideosWithLocalCache(apiVideos));
  } catch (error) {
    reportSyncError('영상 목록 불러오기', error);
  }

  return listVideos();
}

export function getVideo(id: string): WorkoutVideo | undefined {
  return mergeVideos().find((video) => video.id === id);
}

export function filterVideos(
  filters: VideoLibraryFilters,
  videos: WorkoutVideo[] = listVideos(),
): WorkoutVideo[] {
  return filterWorkoutVideos(videos, filters);
}

export function createVideo(input: CreateWorkoutVideoInput): WorkoutVideo | null {
  const uploadResult = input.uploadResult;
  const thumbnailUrl =
    uploadResult && isPersistableRemoteUrl(uploadResult.thumbnailUrl)
      ? uploadResult.thumbnailUrl
      : UPLOADED_VIDEO_PLACEHOLDER_THUMBNAIL;
  const previewUrl =
    uploadResult && isPersistableRemoteUrl(uploadResult.playbackUrl)
      ? uploadResult.playbackUrl
      : undefined;

  const video: WorkoutVideo = {
    id: createVideoId(),
    title: input.title,
    description: input.description,
    durationSec: input.durationSec,
    thumbnailUrl,
    previewUrl,
    tags: input.tags,
    difficulty: input.difficulty,
    bodyParts: input.bodyParts,
    isLoopable: input.isLoopable,
    sourceType: mapVisibilityToSourceType(input.visibility),
    contentSource: 'own',
    isPremium: input.isPremium,
    uploadMeta: buildUploadMeta(input, uploadResult),
  };

  if (!saveUploadedVideo(video)) return null;
  syncCreateVideoToApi(video);
  return video;
}

export function updateVideo(
  id: string,
  patch: Partial<Omit<WorkoutVideo, 'id' | 'uploadMeta'>>,
): WorkoutVideo | null {
  const existing = getUploadedVideos().find((video) => video.id === id);
  if (!existing || !isUploadedVideo(existing)) return null;
  const updated = updateUploadedVideo(id, patch);
  if (updated) {
    syncUpdateVideoToApi(updated);
  }
  return updated;
}

export function updateVideoMetadata(
  id: string,
  input: UpdateWorkoutVideoInput,
): WorkoutVideo | null {
  return updateVideo(id, {
    title: input.title,
    description: input.description,
    durationSec: input.durationSec,
    tags: input.tags,
    bodyParts: input.bodyParts,
    difficulty: input.difficulty,
    isLoopable: input.isLoopable,
    sourceType: mapVisibilityToSourceType(input.visibility),
    isPremium: input.isPremium,
  });
}

export function deleteVideo(id: string): boolean {
  const existing = getUploadedVideos().find((video) => video.id === id);
  if (!existing || !isUploadedVideo(existing)) return false;
  const deleted = deleteUploadedVideo(id);
  if (deleted) {
    syncDeleteVideoToApi(id);
  }
  return deleted;
}
