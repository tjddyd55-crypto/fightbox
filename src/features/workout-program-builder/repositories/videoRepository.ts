/**
 * Workout video data access layer.
 * Merges mock catalog with user-registered metadata from localStorage.
 */
import {
  UPLOADED_VIDEO_PLACEHOLDER_THUMBNAIL,
} from '../constants/builderConstants';
import { mockWorkoutVideos } from '../data/mockWorkoutVideos';
import {
  deleteUploadedVideo,
  getUploadedVideos,
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

export function listVideos(): WorkoutVideo[] {
  return mergeVideos();
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
  return video;
}

function mapVisibilityToSourceType(
  visibility: CreateWorkoutVideoInput['visibility'],
): WorkoutVideo['sourceType'] {
  return visibility === 'gym_only' ? 'gym' : 'private';
}

export function updateVideo(
  id: string,
  patch: Partial<Omit<WorkoutVideo, 'id' | 'uploadMeta'>>,
): WorkoutVideo | null {
  const existing = getUploadedVideos().find((video) => video.id === id);
  if (!existing || !isUploadedVideo(existing)) return null;
  return updateUploadedVideo(id, patch);
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
  return deleteUploadedVideo(id);
}
