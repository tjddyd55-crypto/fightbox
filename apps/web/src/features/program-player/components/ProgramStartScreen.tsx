import { formatDuration } from '../../workout-program-builder/utils/durationUtils';
import type { MockProgramPlayerState } from '../hooks/useMockProgramPlayerState';

interface ProgramStartScreenProps {
  player: MockProgramPlayerState;
}

export function ProgramStartScreen({ player }: ProgramStartScreenProps) {
  const firstBlock = player.blocks[0];
  const videoCount = player.blocks.filter((b) => b.type === 'video').length;
  const restCount = player.blocks.filter((b) => b.type === 'rest').length;
  const countdownCount = player.blocks.filter((b) => b.type === 'countdown').length;

  return (
    <section className="pp-start-screen">
      <div className="pp-start-card">
        <p className="pp-start-brand">FIGHTBOX</p>
        <h1 className="pp-start-title">{player.meta.title}</h1>
        <p className="pp-start-meta">
          총 {formatDuration(player.meta.totalDurationSec)} · {player.meta.totalBlocks}개 블록
        </p>
        <ul className="pp-start-summary">
          <li>운동 {videoCount}개</li>
          <li>휴식 {restCount}개</li>
          <li>카운트다운 {countdownCount}개</li>
        </ul>
        <p className="pp-start-flow">{player.meta.flowPreview}</p>
        <button type="button" className="pp-start-btn" onClick={player.start}>
          프로그램 시작
        </button>
        {firstBlock && (
          <div className="pp-start-first-card">
            <p className="pp-start-first-label">첫 운동</p>
            <strong>{firstBlock.title}</strong>
            <span>{formatDuration(firstBlock.durationSec)}</span>
          </div>
        )}
      </div>
    </section>
  );
}
