import { useEffect, useRef } from 'react';
import type { ProgramBlock, WorkoutVideo } from '../types/workoutProgramBuilder.types';
import type { ProgramPlayerBlock } from '../../program-player/types/programPlayer.types';
import { formatDuration } from '../utils/durationUtils';
import { getVideoById } from '../utils/programTimelineUtils';
import { BLOCK_TYPE_LABEL } from '../utils/blockDisplayUtils';
import { getWorkoutVideoPlaybackUrl } from '../utils/videoPlaybackUtils';
import { YouTubePlayerFrame } from '../../program-player/components/YouTubePlayerFrame';
import { usesVideoEndedForAdvance, shouldReplayVideoAfterEnd } from '../../program-player/utils/programPlayerPlaybackUtils';
import { getPlayerBlockPlaybackHint } from '../../program-player/utils/programPlayerPlaybackUtils';
import type { YouTubePlayerInstance } from '../../program-player/utils/youtubeIframeApi';
import { useTestPlayback } from '../hooks/useTestPlayback';
import { WorkoutVideoPlayer } from './WorkoutVideoPlayer';

interface TestPlaybackModalProps {
  blocks: ProgramBlock[];
  totalDurationSec: number;
  initialBlockId: string | null;
  videos: WorkoutVideo[];
  onClose: () => void;
}

const PLAYER_BLOCK_LABEL: Record<ProgramPlayerBlock['type'], string> = {
  video: '영상',
  rest: '휴식',
  countdown: '카운트다운',
  voice: '음성',
};

function BlockStage({
  block,
  sourceBlock,
  video,
  countdownDisplay,
  isPlaying,
  videoRepeatIndex,
  videoRepeatTarget,
  onVideoLoopComplete,
}: {
  block: ProgramPlayerBlock;
  sourceBlock: ProgramBlock | null;
  video?: WorkoutVideo;
  countdownDisplay: number | null;
  isPlaying: boolean;
  videoRepeatIndex: number;
  videoRepeatTarget: number;
  onVideoLoopComplete: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const youtubePlayerRef = useRef<YouTubePlayerInstance | null>(null);
  const playbackUrl = getWorkoutVideoPlaybackUrl(video) ?? block.playbackUrl;

  useEffect(() => {
    const element = videoRef.current;
    if (!element || !playbackUrl) {
      return;
    }

    if (isPlaying) {
      void element.play().catch(() => undefined);
      return;
    }

    element.pause();
  }, [isPlaying, playbackUrl]);

  useEffect(() => {
    const element = videoRef.current;
    if (!element || !playbackUrl) {
      return;
    }

    element.loop = block.playbackMode === 'loop_until_duration';
    element.load();
    if (isPlaying) {
      void element.play().catch(() => undefined);
    }
  }, [block.id, playbackUrl, isPlaying, block.playbackMode]);

  useEffect(() => {
    const element = videoRef.current;
    if (!element || !playbackUrl) {
      return undefined;
    }

    const handleEnded = () => {
      if (block.playbackMode === 'repeat_count') {
        const shouldReplay = shouldReplayVideoAfterEnd(block, videoRepeatIndex);
        onVideoLoopComplete();
        if (isPlaying && shouldReplay) {
          element.currentTime = 0;
          void element.play().catch(() => undefined);
        }
        return;
      }

      if (block.playbackMode === 'loop_until_duration' && isPlaying) {
        element.currentTime = 0;
        void element.play().catch(() => undefined);
      }
    };

    element.addEventListener('ended', handleEnded);
    return () => element.removeEventListener('ended', handleEnded);
  }, [
    block,
    block.id,
    block.playbackMode,
    playbackUrl,
    isPlaying,
    onVideoLoopComplete,
    videoRepeatIndex,
  ]);

  const isYouTubeBlock =
    block.mediaSource === 'youtube' ||
    Boolean(block.externalVideoId?.trim()) ||
    (Boolean(block.embedUrl?.trim()) && !playbackUrl);

  if (block.type === 'video') {
    if (isYouTubeBlock && block.externalVideoId) {
      return (
        <div
          className="wpb-test-stage wpb-test-stage--video wpb-preview-card--playable"
          aria-label="영상 블록"
        >
          <div className="wpb-test-stage-video-wrap wpb-test-stage-video-wrap--youtube">
            <YouTubePlayerFrame
              videoId={block.externalVideoId}
              embedUrl={block.embedUrl}
              isPlaying={isPlaying}
              title={video?.title ?? block.title}
              className="wpb-youtube-frame"
              onReady={(player) => {
                youtubePlayerRef.current = player;
              }}
              onEnded={() => {
                if (usesVideoEndedForAdvance(block)) {
                  onVideoLoopComplete();
                }
                const player = youtubePlayerRef.current;
                if (player && isPlaying && shouldReplayVideoAfterEnd(block, videoRepeatIndex)) {
                  player.seekTo(0);
                  player.playVideo();
                } else if (
                  block.playbackMode === 'loop_until_duration' &&
                  player &&
                  isPlaying
                ) {
                  player.seekTo(0);
                  player.playVideo();
                }
              }}
            />
          </div>
          <p>{video?.title ?? block.title}</p>
          {block.playbackMode === 'repeat_count' && videoRepeatTarget > 1 && (
            <p className="wpb-test-repeat-badge">
              {videoRepeatIndex} / {videoRepeatTarget} 반복
            </p>
          )}
          {getPlayerBlockPlaybackHint(block) && (
            <p className="wpb-test-playback-hint">{getPlayerBlockPlaybackHint(block)}</p>
          )}
        </div>
      );
    }

    if (playbackUrl) {
      return (
        <div
          className="wpb-test-stage wpb-test-stage--video wpb-preview-card--playable"
          aria-label="영상 블록"
        >
          <div className="wpb-test-stage-video-wrap">
            <WorkoutVideoPlayer
              video={video}
              videoRef={videoRef}
              className="wpb-video-player"
              autoPlay
              muted
            />
          </div>
          <p>{video?.title ?? block.title}</p>
          {block.playbackMode === 'repeat_count' && videoRepeatTarget > 1 && (
            <p className="wpb-test-repeat-badge">
              {videoRepeatIndex} / {videoRepeatTarget} 반복
            </p>
          )}
          {getPlayerBlockPlaybackHint(block) && (
            <p className="wpb-test-playback-hint">{getPlayerBlockPlaybackHint(block)}</p>
          )}
        </div>
      );
    }

    return (
      <div className="wpb-test-stage wpb-test-stage--video" aria-label="영상 블록">
        <div className="wpb-test-stage-thumb">
          <span className="wpb-thumb-placeholder" />
          <span className="wpb-thumb-icon">▶</span>
        </div>
        <p>{video?.title ?? block.title}</p>
        {getPlayerBlockPlaybackHint(block) && (
          <p className="wpb-test-playback-hint">{getPlayerBlockPlaybackHint(block)}</p>
        )}
      </div>
    );
  }

  if (block.type === 'rest') {
    return (
      <div className="wpb-test-stage wpb-test-stage--rest" aria-label="휴식 블록">
        <span className="wpb-test-stage-icon">◌</span>
        <p>{block.message ?? block.description ?? '휴식 중'}</p>
      </div>
    );
  }

  if (block.type === 'countdown') {
    return (
      <div className="wpb-test-stage wpb-test-stage--countdown" aria-label="카운트다운 블록">
        <p className="wpb-test-countdown-message">{block.message ?? '준비하세요'}</p>
        <span className="wpb-test-countdown">{countdownDisplay ?? block.durationSec}</span>
      </div>
    );
  }

  if (block.type === 'voice') {
    const voiceText =
      block.message ??
      block.description ??
      (sourceBlock?.type === 'voice' ? sourceBlock.cueText : '');
    return (
      <div className="wpb-test-stage wpb-test-stage--voice" aria-label="음성 안내 블록">
        <span className="wpb-test-stage-icon">🎤</span>
        <p>{voiceText}</p>
      </div>
    );
  }

  return null;
}

export function TestPlaybackModal({
  blocks,
  totalDurationSec,
  initialBlockId,
  videos,
  onClose,
}: TestPlaybackModalProps) {
  const playback = useTestPlayback({ blocks, videos, initialBlockId });

  const {
    currentBlock,
    nextBlock,
    currentIndex,
    isPlaying,
    isComplete,
    fastMode,
    remainingInBlock,
    totalElapsed,
    progressPercent,
    countdownDisplay,
    sourceBlock,
    playerBlocks,
    videoRepeatIndex,
    videoRepeatTarget,
    onVideoLoopComplete,
    setIsPlaying,
    setFastMode,
    goNext,
    goPrev,
    resetToStart,
  } = playback;

  const displayTotal = totalDurationSec > 0 ? totalDurationSec : playback.totalDuration;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  if (blocks.length === 0) {
    return (
      <div className="wpb-test-modal-backdrop" role="presentation" onClick={onClose}>
        <section
          className="wpb-test-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="wpb-test-title"
          onClick={(e) => e.stopPropagation()}
        >
          <header className="wpb-test-modal-header">
            <span className="wpb-test-badge">관리자 테스트</span>
            <h2 id="wpb-test-title">테스트 재생</h2>
          </header>
          <p className="wpb-empty">타임라인에 블록을 추가한 뒤 테스트해 주세요.</p>
          <footer className="wpb-test-modal-footer">
            <button type="button" className="wpb-btn wpb-btn-ghost" onClick={onClose}>
              닫기
            </button>
          </footer>
        </section>
      </div>
    );
  }

  const currentVideo =
    currentBlock?.type === 'video' && currentBlock.videoId
      ? getVideoById(videos, currentBlock.videoId)
      : undefined;

  const nextLabel =
    nextBlock?.type && nextBlock.type in PLAYER_BLOCK_LABEL
      ? PLAYER_BLOCK_LABEL[nextBlock.type]
      : BLOCK_TYPE_LABEL.video;

  return (
    <div className="wpb-test-modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="wpb-test-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wpb-test-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="wpb-test-modal-header">
          <span className="wpb-test-badge">관리자 테스트 미리보기</span>
          <h2 id="wpb-test-title">프로그램 테스트 재생</h2>
          <p>실제 회원 화면이 아닌 코치용 시뮬레이션입니다.</p>
          <label className="wpb-test-fast-toggle">
            <input
              type="checkbox"
              checked={fastMode}
              onChange={(e) => setFastMode(e.target.checked)}
            />
            <span>빠른 테스트 모드</span>
          </label>
        </header>

        <section className="wpb-test-progress" aria-label="전체 진행률">
          <div className="wpb-test-progress-labels">
            <span>진행률 {progressPercent}%</span>
            <span>
              {isComplete
                ? '완료'
                : `남은 ${formatDuration(Math.max(0, displayTotal - totalElapsed))}`}
            </span>
          </div>
          <div
            className="wpb-test-progress-track"
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <span className="wpb-test-progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
        </section>

        <section className="wpb-test-current" aria-live="polite">
          <span className={`wpb-test-type wpb-test-type--${currentBlock?.type ?? 'video'}`}>
            {currentBlock ? PLAYER_BLOCK_LABEL[currentBlock.type] : '—'}
          </span>
          <h3>{currentBlock?.title ?? '—'}</h3>
          <p className="wpb-test-current-meta">
            블록 {currentIndex + 1} / {playerBlocks.length} · 남은{' '}
            {formatDuration(remainingInBlock)}
            {currentVideo && ` · ${currentVideo.difficulty}`}
          </p>
          {currentBlock && (
            <BlockStage
              block={currentBlock}
              sourceBlock={sourceBlock}
              video={currentVideo}
              countdownDisplay={countdownDisplay}
              isPlaying={isPlaying}
              videoRepeatIndex={videoRepeatIndex}
              videoRepeatTarget={videoRepeatTarget}
              onVideoLoopComplete={onVideoLoopComplete}
            />
          )}
          {isComplete && <p className="wpb-test-hint">프로그램 재생이 완료되었습니다.</p>}
        </section>

        {nextBlock && !isComplete && (
          <section className="wpb-test-next">
            <span className="wpb-test-next-label">다음 블록</span>
            <p>
              <span className={`wpb-type-pill ${nextBlock.type}`}>{nextLabel}</span>{' '}
              {nextBlock.title}
              {getPlayerBlockPlaybackHint(nextBlock)
                ? ` · ${getPlayerBlockPlaybackHint(nextBlock)}`
                : ''}
            </p>
          </section>
        )}

        <footer className="wpb-test-modal-footer">
          <button
            type="button"
            className="wpb-btn wpb-btn-ghost"
            onClick={goPrev}
            disabled={currentIndex === 0}
            aria-label="이전 블록"
          >
            이전
          </button>
          <button
            type="button"
            className="wpb-btn wpb-btn-ghost"
            onClick={() => setIsPlaying((p) => !p)}
            aria-pressed={isPlaying}
          >
            {isPlaying ? '일시정지' : '재생'}
          </button>
          <button
            type="button"
            className="wpb-btn wpb-btn-ghost"
            onClick={goNext}
            disabled={currentIndex >= playerBlocks.length - 1 && !isComplete}
            aria-label="다음 블록"
          >
            다음
          </button>
          <button type="button" className="wpb-btn wpb-btn-ghost" onClick={resetToStart}>
            처음부터
          </button>
          <button type="button" className="wpb-btn wpb-btn-primary" onClick={onClose}>
            닫기
          </button>
        </footer>
      </section>
    </div>
  );
}
