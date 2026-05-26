import type { WorkoutVideo } from '../types/workoutProgramBuilder.types';
import { getYouTubeThumbnailUrl } from './youtubeVideoUtils';

function isRemoteHttpUrl(url: string | undefined): url is string {
  if (!url || url.startsWith('blob:')) {
    return false;
  }
  return url.startsWith('http://') || url.startsWith('https://');
}

export function isYouTubeWorkoutVideo(video?: WorkoutVideo | null): boolean {
  if (!video) {
    return false;
  }
  return video.mediaSource === 'youtube' || Boolean(video.youtubeMeta?.videoId);
}

export function isUploadedR2WorkoutVideo(video: WorkoutVideo): boolean {
  return !isYouTubeWorkoutVideo(video) && Boolean(video.uploadMeta?.storageKey);
}

export function getWorkoutVideoEmbedUrl(video?: WorkoutVideo | null): string {
  if (!video?.youtubeMeta?.embedUrl) {
    return '';
  }
  return video.youtubeMeta.embedUrl;
}

/** Native MP4 playback URL — never use YouTube embed URLs here. */
export function getWorkoutVideoPlaybackUrl(video?: WorkoutVideo | null): string {
  if (!video || isYouTubeWorkoutVideo(video)) {
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

  if (isYouTubeWorkoutVideo(video)) {
    const thumb = video.thumbnailUrl || getYouTubeThumbnailUrl(video.youtubeMeta!.videoId);
    return isRemoteHttpUrl(thumb) ? thumb : undefined;
  }

  const candidates = [video.thumbnailUrl, video.uploadMeta?.remoteThumbnailUrl];

  for (const candidate of candidates) {
    if (isRemoteHttpUrl(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

export function hasWorkoutVideoPlaybackUrl(video?: WorkoutVideo | null): boolean {
  return getWorkoutVideoPlaybackUrl(video).length > 0 || isYouTubeWorkoutVideo(video);
}
