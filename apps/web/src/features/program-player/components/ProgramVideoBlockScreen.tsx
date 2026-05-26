import { useCallback, useEffect, useRef } from 'react';
import { formatPlayerTime } from '../utils/programPlayerTimeUtils';
import type { ProgramPlayerBlock } from '../types/programPlayer.types';
import {
  formatActiveRepeatProgress,
  getPlayerBlockPlaybackHint,
  shouldLoopVideo,
  shouldReplayVideoAfterEnd,
  usesVideoEndedForAdvance,
} from '../utils/programPlayerPlaybackUtils';
import type { YouTubePlayerInstance } from '../utils/youtubeIframeApi';
import { YouTubePlayerFrame } from './YouTubePlayerFrame';

interface ProgramVideoBlockScreenProps {
  block: ProgramPlayerBlock;
  remainingSec: number;
  nextBlock: ProgramPlayerBlock | null;
  elapsedSec: number;
  isPlaying: boolean;
  currentRepeatIndex: number;
  currentRepeatCount: number;
  onVideoLoopComplete?: () => void;
  onVideoOriginalEnded?: () => void;
  variant?: 'default' | 'display';
}

function isYouTubePlayerBlock(block: ProgramPlayerBlock): boolean {
  return (
    block.mediaSource === 'youtube' ||
    Boolean(block.externalVideoId?.trim()) ||
    (Boolean(block.embedUrl?.trim()) && !block.playbackUrl?.trim())
  );
}

export function ProgramVideoBlockScreen({
  block,
  remainingSec,
  nextBlock,
  elapsedSec,
  isPlaying,
  currentRepeatIndex,
  currentRepeatCount,
  onVideoLoopComplete,
  onVideoOriginalEnded,
  variant = 'default',
}: ProgramVideoBlockScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const youtubePlayerRef = useRef<YouTubePlayerInstance | null>(null);
  const loop = shouldLoopVideo(block);
  const playbackHint = getPlayerBlockPlaybackHint(block);
  const blockDuration = Math.max(1, block.durationSec);
  const progress = (elapsedSec / blockDuration) * 100;
  const isYouTube = isYouTubePlayerBlock(block);
  const hasPlayback = isYouTube
    ? Boolean(block.externalVideoId?.trim())
    : Boolean(block.playbackUrl);
  const showRepeatBadge =
    block.playbackMode === 'repeat_count' && currentRepeatCount > 1;
  const activeRepeatLabel = formatActiveRepeatProgress(block, currentRepeatIndex);

  const handleYouTubeEnded = useCallback(() => {
    if (usesVideoEndedForAdvance(block)) {
      onVideoLoopComplete?.();
    } else if (block.playbackMode === 'original_duration') {
      onVideoOriginalEnded?.();
      return;
    }

    const player = youtubePlayerRef.current;
    if (player && isPlaying && shouldReplayVideoAfterEnd(block, currentRepeatIndex)) {
      player.seekTo(0);
      player.playVideo();
    }
  }, [
    block,
    currentRepeatIndex,
    isPlaying,
    onVideoLoopComplete,
    onVideoOriginalEnded,
  ]);

  const handleHtmlVideoEnded = useCallback(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (block.playbackMode === 'repeat_count' && usesVideoEndedForAdvance(block)) {
      const shouldReplay = shouldReplayVideoAfterEnd(block, currentRepeatIndex);
      onVideoLoopComplete?.();
      if (isPlaying && shouldReplay) {
        video.currentTime = 0;
        void video.play().catch(() => undefined);
      }
      return;
    }

    if (block.playbackMode === 'original_duration') {
      onVideoOriginalEnded?.();
      return;
    }

    if (block.playbackMode === 'loop_until_duration' && isPlaying) {
      video.currentTime = 0;
      void video.play().catch(() => undefined);
    }
  }, [
    block,
    currentRepeatIndex,
    isPlaying,
    onVideoLoopComplete,
    onVideoOriginalEnded,
  ]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hasPlayback || isYouTube) {
      return;
    }
    video.load();
  }, [block.id, block.playbackUrl, hasPlayback, isYouTube]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hasPlayback || isYouTube) {
      return;
    }

    video.loop = loop;

    if (isPlaying) {
      void video.play().catch(() => {
        /* autoplay blocked — timer still advances */
      });
      return;
    }

    video.pause();
  }, [isPlaying, block.id, hasPlayback, loop, isYouTube]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hasPlayback || isYouTube) {
      return undefined;
    }

    video.addEventListener('ended', handleHtmlVideoEnded);
    return () => video.removeEventListener('ended', handleHtmlVideoEnded);
  }, [block.id, hasPlayback, isYouTube, handleHtmlVideoEnded]);

  return (
    <section className={`pp-video-screen pp-video-screen--${variant}`}>
      <div className="pp-video-stage">
        {hasPlayback && isYouTube && block.externalVideoId ? (
          <YouTubePlayerFrame
            videoId={block.externalVideoId}
            embedUrl={block.embedUrl}
            isPlaying={isPlaying}
            title={block.title}
            className="pp-youtube-frame"
            onEnded={handleYouTubeEnded}
            onReady={(player) => {
              youtubePlayerRef.current = player;
            }}
          />
        ) : hasPlayback ? (
          <video
            ref={videoRef}
            className="pp-video-element"
            src={block.playbackUrl}
            poster={block.thumbnailUrl ?? undefined}
            controls={variant !== 'display'}
            playsInline
            preload="metadata"
            loop={loop}
          />
        ) : (
          <div className="pp-video-placeholder" aria-hidden="true">
            <span className="pp-video-placeholder-icon">▶</span>
            <span className="pp-video-placeholder-label">영상 URL이 없습니다.</span>
          </div>
        )}
        {!hasPlayback && (
          <div className="pp-video-fake-progress">
            <div className="pp-video-fake-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
      <div className="pp-video-info">
        <h2 className="pp-video-title">{block.title}</h2>
        <p className="pp-video-timer">{formatPlayerTime(remainingSec)}</p>
        {showRepeatBadge && (
          <p className="pp-video-repeat-badge">
            {activeRepeatLabel ?? `${currentRepeatIndex} / ${currentRepeatCount} 반복`}
          </p>
        )}
        {playbackHint && !showRepeatBadge && (
          <p className="pp-video-playback-hint">{playbackHint}</p>
        )}
        {nextBlock && <p className="pp-video-next">다음 · {nextBlock.title}</p>}
      </div>
    </section>
  );
}
