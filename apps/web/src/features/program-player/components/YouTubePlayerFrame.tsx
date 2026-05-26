import { useEffect, useId, useRef } from 'react';
import { getYouTubeEmbedUrl } from '../../workout-program-builder/utils/youtubeVideoUtils';
import {
  isYouTubePlayerEnded,
  loadYouTubeIframeApi,
  type YouTubePlayerInstance,
} from '../utils/youtubeIframeApi';

interface YouTubePlayerFrameProps {
  videoId: string;
  embedUrl?: string;
  isPlaying: boolean;
  className?: string;
  title?: string;
  onEnded?: () => void;
  onReady?: (player: YouTubePlayerInstance) => void;
}

export function YouTubePlayerFrame({
  videoId,
  embedUrl,
  isPlaying,
  className = 'pp-youtube-frame',
  title = 'YouTube 영상',
  onEnded,
  onReady,
}: YouTubePlayerFrameProps) {
  const containerId = useId().replace(/:/g, '');
  const playerRef = useRef<YouTubePlayerInstance | null>(null);
  const onEndedRef = useRef(onEnded);
  const onReadyRef = useRef(onReady);

  useEffect(() => {
    onEndedRef.current = onEnded;
    onReadyRef.current = onReady;
  }, [onEnded, onReady]);

  useEffect(() => {
    let disposed = false;

    const mount = async () => {
      await loadYouTubeIframeApi();
      if (disposed || !window.YT?.Player) {
        return;
      }

      const origin =
        typeof window !== 'undefined' ? window.location.origin : undefined;
      const src = embedUrl?.trim() || getYouTubeEmbedUrl(videoId, origin);

      playerRef.current?.destroy();

      playerRef.current = new window.YT.Player(containerId, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          enablejsapi: 1,
          playsinline: 1,
          rel: 0,
          iv_load_policy: 3,
          controls: 0,
          disablekb: 1,
          origin,
        },
        events: {
          onReady: (event: { target: YouTubePlayerInstance }) => {
            const player = event.target as unknown as YouTubePlayerInstance;
            playerRef.current = player;
            onReadyRef.current?.(player);
            if (isPlaying) {
              player.playVideo();
            }
          },
          onStateChange: (event: { data: number }) => {
            if (isYouTubePlayerEnded(event)) {
              onEndedRef.current?.();
            }
          },
        },
      }) as unknown as YouTubePlayerInstance;

      void src;
    };

    void mount();

    return () => {
      disposed = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [containerId, videoId, embedUrl]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) {
      return;
    }
    if (isPlaying) {
      player.playVideo();
    } else {
      player.pauseVideo();
    }
  }, [isPlaying]);

  return (
    <div className={className}>
      <div id={containerId} className="pp-youtube-frame-target" title={title} />
    </div>
  );
}
