import { useEffect } from 'react';
import type { ProgramBlock, WorkoutVideo } from '../types/workoutProgramBuilder.types';
import { formatDuration } from '../utils/durationUtils';
import { getVideoById } from '../utils/programTimelineUtils';
import { BLOCK_TYPE_LABEL, getBlockTypeIcon } from '../utils/blockDisplayUtils';
import { useTestPlayback } from '../hooks/useTestPlayback';

interface TestPlaybackModalProps {
  blocks: ProgramBlock[];
  totalDurationSec: number;
  initialBlockId: string | null;
  videos: WorkoutVideo[];
  onClose: () => void;
}

function BlockStage({
  block,
  video,
  countdownDisplay,
}: {
  block: ProgramBlock;
  video?: WorkoutVideo;
  countdownDisplay: number | null;
}) {
  if (block.type === 'video') {
    return (
      <div className="wpb-test-stage wpb-test-stage--video" aria-label="영상 블록">
        <div className="wpb-test-stage-thumb">
          <span className="wpb-thumb-placeholder" />
          <span className="wpb-thumb-icon">▶</span>
        </div>
        <p>{video?.title ?? block.title}</p>
      </div>
    );
  }

  if (block.type === 'rest') {
    return (
      <div className="wpb-test-stage wpb-test-stage--rest" aria-label="휴식 블록">
        <span className="wpb-test-stage-icon">◌</span>
        <p>{block.message ?? '휴식 중'}</p>
      </div>
    );
  }

  if (block.type === 'countdown') {
    return (
      <div className="wpb-test-stage wpb-test-stage--countdown" aria-label="카운트다운 블록">
        <span className="wpb-test-countdown">{countdownDisplay ?? block.countFromSec}</span>
      </div>
    );
  }

  return (
    <div className="wpb-test-stage wpb-test-stage--voice" aria-label="음성 안내 블록">
      <span className="wpb-test-stage-icon">♪</span>
      <p>{block.cueText}</p>
    </div>
  );
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
    currentBlock?.type === 'video' ? getVideoById(videos, currentBlock.videoId) : undefined;

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
            {currentBlock && getBlockTypeIcon(currentBlock)}{' '}
            {currentBlock && BLOCK_TYPE_LABEL[currentBlock.type]}
          </span>
          <h3>{currentBlock?.title ?? '—'}</h3>
          <p className="wpb-test-current-meta">
            블록 {currentIndex + 1} / {blocks.length} · 남은{' '}
            {formatDuration(remainingInBlock)}
            {currentVideo && ` · ${currentVideo.difficulty}`}
          </p>
          {currentBlock && (
            <BlockStage
              block={currentBlock}
              video={currentVideo}
              countdownDisplay={countdownDisplay}
            />
          )}
          {isComplete && <p className="wpb-test-hint">프로그램 재생이 완료되었습니다.</p>}
        </section>

        {nextBlock && !isComplete && (
          <section className="wpb-test-next">
            <span className="wpb-test-next-label">다음 블록</span>
            <p>
              <span className={`wpb-type-pill ${nextBlock.type}`}>
                {BLOCK_TYPE_LABEL[nextBlock.type]}
              </span>{' '}
              {nextBlock.title}
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
            disabled={currentIndex >= blocks.length - 1 && !isComplete}
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
