import type { RefObject } from 'react';
import type { ProgramPlayerState } from '../hooks/useProgramPlayerState';

interface ProgramPlayerControlsProps {
  player: ProgramPlayerState;
  rootRef?: RefObject<HTMLElement | null>;
  size?: 'default' | 'large' | 'minimal';
  showFullscreen?: boolean;
}

async function requestPlayerFullscreen(root: HTMLElement | null): Promise<void> {
  if (!root) return;
  try {
    await root.requestFullscreen();
  } catch (error) {
    console.warn('[program-player] fullscreen failed', error);
  }
}

export function ProgramPlayerControls({
  player,
  rootRef,
  size = 'default',
  showFullscreen = true,
}: ProgramPlayerControlsProps) {
  const canGoPrevious = player.mode !== 'start' && player.mode !== 'complete';
  const isComplete = player.mode === 'complete';

  return (
    <div className={`pp-controls pp-controls--${size}`} role="toolbar" aria-label="프로그램 재생 컨트롤">
      <button
        type="button"
        className="pp-control-btn"
        onClick={player.previous}
        disabled={!canGoPrevious}
      >
        이전
      </button>
      <button
        type="button"
        className="pp-control-btn pp-control-btn--primary"
        onClick={player.mode === 'start' ? player.start : player.togglePlay}
        disabled={isComplete}
      >
        {player.mode === 'start' ? '시작' : player.isPlaying ? '일시정지' : '재생'}
      </button>
      <button
        type="button"
        className="pp-control-btn"
        onClick={player.next}
        disabled={isComplete}
      >
        다음
      </button>
      <button
        type="button"
        className="pp-control-btn"
        onClick={player.restart}
        disabled={player.mode === 'start'}
      >
        다시시작
      </button>
      {showFullscreen && (
        <button
          type="button"
          className="pp-control-btn pp-control-btn--ghost"
          onClick={() => void requestPlayerFullscreen(rootRef?.current ?? null)}
        >
          전체화면
        </button>
      )}
    </div>
  );
}
