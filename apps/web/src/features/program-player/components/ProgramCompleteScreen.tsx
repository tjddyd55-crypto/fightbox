import { formatPlayerTime } from '../utils/programPlayerTimeUtils';
import type { ProgramPlayerState } from '../hooks/useProgramPlayerState';

interface ProgramCompleteScreenProps {
  player: ProgramPlayerState;
}

export function ProgramCompleteScreen({ player }: ProgramCompleteScreenProps) {
  return (
    <section className="pp-complete-screen">
      <div className="pp-complete-card">
        <div className="pp-complete-icon" aria-hidden="true">
          🏆
        </div>
        <h1>프로그램 완료!</h1>
        <p className="pp-complete-title">{player.meta.title}</p>
        <p className="pp-complete-meta">
          총 {player.meta.totalBlocks}개 블록 · {formatPlayerTime(player.meta.totalDurationSec)}
        </p>
        <div className="pp-complete-actions">
          <button type="button" className="pp-control-btn pp-control-btn--primary" onClick={player.start}>
            다시 시작
          </button>
          <button type="button" className="pp-control-btn" onClick={player.exitToStart}>
            종료하기
          </button>
        </div>
      </div>
    </section>
  );
}
