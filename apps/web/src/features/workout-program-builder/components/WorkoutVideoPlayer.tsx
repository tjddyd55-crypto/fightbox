import type { RefObject } from 'react';
import type { WorkoutVideo } from '../types/workoutProgramBuilder.types';
import {
  getWorkoutVideoPlaybackUrl,
  getWorkoutVideoPosterUrl,
} from '../utils/videoPlaybackUtils';

interface WorkoutVideoPlayerProps {
  video?: WorkoutVideo | null;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  playsInline?: boolean;
  preload?: 'none' | 'metadata' | 'auto';
  videoRef?: RefObject<HTMLVideoElement | null>;
}

export function WorkoutVideoPlayer({
  video,
  className = 'wpb-video-player',
  controls = true,
  autoPlay = false,
  muted = false,
  playsInline = true,
  preload = 'metadata',
  videoRef,
}: WorkoutVideoPlayerProps) {
  const playbackUrl = getWorkoutVideoPlaybackUrl(video);
  if (!playbackUrl) {
    return null;
  }

  return (
    <video
      ref={videoRef}
      className={className}
      src={playbackUrl}
      poster={getWorkoutVideoPosterUrl(video)}
      controls={controls}
      autoPlay={autoPlay}
      muted={muted}
      playsInline={playsInline}
      preload={preload}
    />
  );
}
