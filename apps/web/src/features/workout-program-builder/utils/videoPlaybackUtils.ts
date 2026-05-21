import type { WorkoutVideo } from '../types/workoutProgramBuilder.types';

function isRemoteHttpUrl(url: string | undefined): url is string {
  if (!url || url.startsWith('blob:')) {
    return false;
  }
  return url.startsWith('http://') || url.startsWith('https://');
}

export function getWorkoutVideoPlaybackUrl(video?: WorkoutVideo | null): string {
  if (!video) {
    return '';
  }

  const candidates = [video.previewUrl, video.uploadMeta?.playbackUrl];

  for (const candidate of candidates) {
    if (isRemoteHttpUrl(candidate)) {
      return candidate;
    }
  }

  return '';
}

export function getWorkoutVideoPosterUrl(video?: WorkoutVideo | null): string | undefined {
  if (!video) {
    return undefined;
  }

  const remoteThumbnail = video.uploadMeta?.remoteThumbnailUrl;
  if (isRemoteHttpUrl(remoteThumbnail)) {
    return remoteThumbnail;
  }

  if (isRemoteHttpUrl(video.thumbnailUrl)) {
    return video.thumbnailUrl;
  }

  return undefined;
}

export function hasWorkoutVideoPlaybackUrl(video?: WorkoutVideo | null): boolean {
  return getWorkoutVideoPlaybackUrl(video).length > 0;
}
