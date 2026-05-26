import { useEffect, useRef } from 'react';
import { formatPlayerTime } from '../utils/programPlayerTimeUtils';
import type { ProgramPlayerBlock } from '../types/programPlayer.types';
import {
  getPlayerBlockPlaybackHint,
  shouldLoopVideo,
} from '../utils/programPlayerPlaybackUtils';

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
  const loop = shouldLoopVideo(block);
  const playbackHint = getPlayerBlockPlaybackHint(block);
  const blockDuration = Math.max(1, block.durationSec);
  const progress = (elapsedSec / blockDuration) * 100;
  const hasPlayback = Boolean(block.playbackUrl);
  const showRepeatBadge =
    block.playbackMode === 'repeat_count' && currentRepeatCount > 1;

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hasPlayback) {
      return;
    }
    video.load();
  }, [block.id, block.playbackUrl, hasPlayback]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hasPlayback) {
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
  }, [isPlaying, block.id, hasPlayback, loop]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hasPlayback || block.playbackMode !== 'repeat_count') {
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
  }, [block.id, block.playbackMode, hasPlayback, isPlaying, onVideoLoopComplete]);

  return (
    <section className={`pp-video-screen pp-video-screen--${variant}`}>
      <div className="pp-video-stage">
        {hasPlayback ? (
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
