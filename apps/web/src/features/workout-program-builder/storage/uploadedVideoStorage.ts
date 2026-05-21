import { UPLOADED_VIDEOS_STORAGE_KEY } from '../constants/builderConstants';
import type { WorkoutVideo } from '../types/workoutProgramBuilder.types';

function readRaw(): WorkoutVideo[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(UPLOADED_VIDEOS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isWorkoutVideo);
  } catch {
    return [];
  }
}

function writeAll(videos: WorkoutVideo[]): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(UPLOADED_VIDEOS_STORAGE_KEY, JSON.stringify(videos));
    return true;
  } catch {
    return false;
  }
}

function isWorkoutVideo(value: unknown): value is WorkoutVideo {
  if (!value || typeof value !== 'object') return false;
  const video = value as WorkoutVideo;
  return (
    typeof video.id === 'string' &&
    typeof video.title === 'string' &&
    typeof video.durationSec === 'number' &&
    Array.isArray(video.tags) &&
    Array.isArray(video.bodyParts) &&
    typeof video.difficulty === 'string' &&
    typeof video.isLoopable === 'boolean' &&
    typeof video.sourceType === 'string' &&
    typeof video.thumbnailUrl === 'string'
  );
}

export function getUploadedVideos(): WorkoutVideo[] {
  return readRaw();
}

export function saveUploadedVideo(video: WorkoutVideo): boolean {
  const list = readRaw();
  const index = list.findIndex((item) => item.id === video.id);
  const next =
    index >= 0
      ? [...list.slice(0, index), video, ...list.slice(index + 1)]
      : [...list, video];
  return writeAll(next);
}

export function updateUploadedVideo(
  videoId: string,
  patch: Partial<WorkoutVideo>,
): WorkoutVideo | null {
  const list = readRaw();
  const index = list.findIndex((item) => item.id === videoId);
  if (index < 0) return null;
  const updated: WorkoutVideo = { ...list[index], ...patch, id: videoId };
  const next = [...list.slice(0, index), updated, ...list.slice(index + 1)];
  if (!writeAll(next)) return null;
  return updated;
}

export function deleteUploadedVideo(videoId: string): boolean {
  const list = readRaw();
  const next = list.filter((item) => item.id !== videoId);
  if (next.length === list.length) return false;
  return writeAll(next);
}

export function replaceUploadedVideos(videos: WorkoutVideo[]): boolean {
  return writeAll(videos);
}
