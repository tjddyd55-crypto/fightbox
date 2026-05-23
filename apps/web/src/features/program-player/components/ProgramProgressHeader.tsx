import { formatDuration } from '../../workout-program-builder/utils/durationUtils';
import type { ProgramPlayerState } from '../hooks/useProgramPlayerState';

interface ProgramProgressHeaderProps {
  player: ProgramPlayerState;
  variant?: 'default' | 'large' | 'compact';
  showControlsHint?: boolean;
}

export function ProgramProgressHeader({
  player,
  variant = 'default',
  showControlsHint = false,
}: ProgramProgressHeaderProps) {
  const blockLabel =
    player.mode === 'start'
      ? '시작 전'
      : player.mode === 'complete'
        ? '완료'
        : `블록 ${player.currentIndex + 1} / ${player.blocks.length}`;

  return (
    <header className={`pp-progress-header pp-progress-header--${variant}`}>
      <div className="pp-progress-header-top">
        <div>
          <p className="pp-progress-brand">FIGHTBOX</p>
          <h1 className="pp-progress-title">{player.meta.title}</h1>
        </div>
        <div className="pp-progress-meta">
          <span className="pp-progress-block">{blockLabel}</span>
          <span className="pp-progress-remaining">
            {formatDuration(player.totalRemainingSec)} 남음
          </span>
        </div>
      </div>
      <div className="pp-progress-bar-wrap" aria-hidden="true">
        <div className="pp-progress-bar">
          <div className="pp-progress-bar-fill" style={{ width: `${player.progressPercent}%` }} />
        </div>
        <span className="pp-progress-percent">{player.progressPercent}%</span>
      </div>
      {showControlsHint && (
        <p className="pp-progress-hint">Space 재생 · ← → 이동 · F 전체화면</p>
      )}
    </header>
  );
}
