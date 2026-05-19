import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ProgramBlock, WorkoutVideo } from '../types/workoutProgramBuilder.types';
import { formatDuration } from '../utils/durationUtils';
import { getVideoById } from '../utils/programTimelineUtils';
import { BLOCK_TYPE_LABEL, getBlockTypeIcon } from '../utils/blockDisplayUtils';

interface TestPlaybackModalProps {
  blocks: ProgramBlock[];
  totalDurationSec: number;
  initialBlockId: string | null;
  videos: WorkoutVideo[];
  onClose: () => void;
}

export function TestPlaybackModal({
  blocks,
  totalDurationSec,
  initialBlockId,
  videos,
  onClose,
}: TestPlaybackModalProps) {
  const initialIndex = useMemo(() => {
    if (!initialBlockId) return 0;
    const idx = blocks.findIndex((b) => b.id === initialBlockId);
    return idx >= 0 ? idx : 0;
  }, [blocks, initialBlockId]);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(true);

  const currentBlock = blocks[currentIndex] ?? null;
  const nextBlock = blocks[currentIndex + 1] ?? null;

  const elapsedBeforeSec = useMemo(
    () => blocks.slice(0, currentIndex).reduce((sum, b) => sum + b.durationSec, 0),
    [blocks, currentIndex],
  );

  const progressPercent =
    totalDurationSec > 0
      ? Math.min(100, Math.round((elapsedBeforeSec / totalDurationSec) * 100))
      : 0;

  const goNext = useCallback(() => {
    setCurrentIndex((i) => Math.min(i + 1, blocks.length - 1));
  }, [blocks.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
  }, []);

  useEffect(() => {
    if (!isPlaying || !currentBlock || blocks.length === 0) return;

    const timer = window.setTimeout(() => {
      if (currentIndex < blocks.length - 1) {
        setCurrentIndex((i) => i + 1);
      } else {
        setIsPlaying(false);
      }
    }, Math.min(currentBlock.durationSec * 1000, 8000));

    return () => window.clearTimeout(timer);
  }, [isPlaying, currentBlock, currentIndex, blocks.length]);

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
    currentBlock?.type === 'video'
      ? getVideoById(videos, currentBlock.videoId)
      : undefined;

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
        </header>

        <section className="wpb-test-progress" aria-label="전체 진행률">
          <div className="wpb-test-progress-labels">
            <span>진행률 {progressPercent}%</span>
            <span>남은 {formatDuration(Math.max(0, totalDurationSec - elapsedBeforeSec))}</span>
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
            블록 {currentIndex + 1} / {blocks.length} ·{' '}
            {currentBlock ? formatDuration(currentBlock.durationSec) : '—'}
            {currentVideo && ` · ${currentVideo.difficulty}`}
          </p>
          {currentBlock?.type === 'rest' && (
            <p className="wpb-test-hint">{currentBlock.message ?? '휴식 구간'}</p>
          )}
          {currentBlock?.type === 'countdown' && (
            <p className="wpb-test-countdown">{currentBlock.countFromSec}</p>
          )}
        </section>

        {nextBlock && (
          <section className="wpb-test-next">
            <span className="wpb-test-next-label">다음 블록</span>
            <p>
              <span className={`wpb-type-pill ${nextBlock.type}`}>
                {BLOCK_TYPE_LABEL[nextBlock.type]}
              </span>{' '}
              {nextBlock.title} · {formatDuration(nextBlock.durationSec)}
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
            disabled={currentIndex >= blocks.length - 1}
            aria-label="다음 블록"
          >
            다음 블록
          </button>
          <button type="button" className="wpb-btn wpb-btn-primary" onClick={onClose}>
            닫기
          </button>
        </footer>
      </section>
    </div>
  );
}
