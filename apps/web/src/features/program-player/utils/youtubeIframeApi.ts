/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        options: Record<string, unknown>,
      ) => unknown;
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export interface YouTubePlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  stopVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead?: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
}

type YouTubePlayerStateChangeEvent = { data: number };

const YT_SCRIPT_ID = 'fightbox-youtube-iframe-api';
const YT_ENDED = 0;

let apiReadyPromise: Promise<void> | null = null;

export function loadYouTubeIframeApi(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  if (window.YT?.Player) {
    return Promise.resolve();
  }

  if (!apiReadyPromise) {
    apiReadyPromise = new Promise((resolve, reject) => {
      const existing = document.getElementById(YT_SCRIPT_ID);
      if (existing) {
        const prior = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
          prior?.();
          resolve();
        };
        return;
      }

      window.onYouTubeIframeAPIReady = () => resolve();

      const script = document.createElement('script');
      script.id = YT_SCRIPT_ID;
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.onerror = () => reject(new Error('Failed to load YouTube IFrame API'));
      document.head.appendChild(script);
    });
  }

  return apiReadyPromise;
}

export function isYouTubePlayerEnded(event: YouTubePlayerStateChangeEvent): boolean {
  return event.data === YT_ENDED;
}

export type { YouTubePlayerStateChangeEvent };
