import { useCallback, useEffect, useRef } from 'react';
import { formatPlayerTime } from '../utils/programPlayerTimeUtils';
import type { ProgramPlayerBlock } from '../types/programPlayer.types';
import {
  getPlayerBlockPlaybackHint,
  shouldLoopVideo,
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

  const handleYouTubeEnded = useCallback(() => {
    if (usesVideoEndedForAdvance(block)) {
      onVideoLoopComplete?.();
    }
    const player = youtubePlayerRef.current;
    if (
      player &&
      isPlaying &&
      (block.playbackMode === 'loop_until_duration' ||
        (block.playbackMode === 'repeat_count' &&
          currentRepeatIndex < Math.max(1, block.repeatCount ?? 1)))
    ) {
      player.seekTo(0);
      player.playVideo();
    }
  }, [
    block,
    currentRepeatIndex,
    isPlaying,
    onVideoLoopComplete,
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
    if (!video || !hasPlayback || isYouTube || block.playbackMode !== 'repeat_count') {
      return undefined;
    }

    const handleEnded = () => {
      onVideoLoopComplete?.();
      if (isPlaying) {
        video.currentTime = 0;
        void video.play().catch(() => undefined);
      }
    };

    video.addEventListener('ended', handleEnded);
    return () => video.removeEventListener('ended', handleEnded);
  }, [block.id, block.playbackMode, hasPlayback, isPlaying, isYouTube, onVideoLoopComplete]);

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
            {currentRepeatIndex} / {currentRepeatCount} 반복
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
