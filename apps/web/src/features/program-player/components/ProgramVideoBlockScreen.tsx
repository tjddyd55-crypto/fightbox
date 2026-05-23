import { useEffect, useRef } from 'react';
import { formatPlayerTime } from '../utils/programPlayerTimeUtils';
import type { ProgramPlayerBlock } from '../types/programPlayer.types';

interface ProgramVideoBlockScreenProps {
  block: ProgramPlayerBlock;
  remainingSec: number;
  nextBlock: ProgramPlayerBlock | null;
  elapsedSec: number;
  isPlaying: boolean;
  variant?: 'default' | 'display';
}

export function ProgramVideoBlockScreen({
  block,
  remainingSec,
  nextBlock,
  elapsedSec,
  isPlaying,
  variant = 'default',
}: ProgramVideoBlockScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const progress = block.durationSec > 0 ? (elapsedSec / block.durationSec) * 100 : 0;
  const hasPlayback = Boolean(block.playbackUrl);

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

    if (isPlaying) {
      void video.play().catch(() => {
        /* autoplay blocked — timer still advances; user can use controls */
      });
      return;
    }

    video.pause();
  }, [isPlaying, block.id, hasPlayback]);

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
        {nextBlock && <p className="pp-video-next">다음 · {nextBlock.title}</p>}
      </div>
    </section>
  );
}
