import { formatDuration } from '../../workout-program-builder/utils/durationUtils';
import type { ProgramPlayerState } from '../hooks/useProgramPlayerState';

interface ProgramQueueViewProps {
  player: ProgramPlayerState;
}

export function ProgramQueueView({ player }: ProgramQueueViewProps) {
  const upcoming = player.blocks.slice(player.currentIndex + 1, player.currentIndex + 6);

  return (
    <section className="pp-queue-view">
      <header className="pp-queue-header">
        <p className="pp-progress-brand">FIGHTBOX · QUEUE</p>
        <h1>{player.meta.title}</h1>
        <p className="pp-queue-progress">
          진행률 {player.progressPercent}% · {formatDuration(player.totalRemainingSec)} 남음
        </p>
      </header>

      {player.currentBlock && player.mode !== 'start' && player.mode !== 'complete' && (
        <div className="pp-queue-current">
          <p className="pp-queue-label">현재</p>
          <h2>{player.currentBlock.title}</h2>
          <p className="pp-queue-timer">{formatDuration(player.remainingSec)}</p>
        </div>
      )}

      <div className="pp-queue-upcoming">
        <h3>다음 운동</h3>
        <ol className="pp-queue-list">
          {upcoming.length === 0 ? (
            <li className="pp-queue-empty">다음 블록이 없습니다</li>
          ) : (
            upcoming.map((block, offset) => (
              <li key={block.id} className="pp-queue-item">
                <span className="pp-queue-index">{player.currentIndex + offset + 2}</span>
                <div>
                  <strong>{block.title}</strong>
                  <span>{formatDuration(block.durationSec)}</span>
                </div>
              </li>
            ))
          )}
        </ol>
      </div>

      <div className="pp-queue-done">
        <h3>완료</h3>
        <ul>
          {player.blocks.slice(0, player.currentIndex).map((block, index) => (
            <li key={block.id}>
              <span>✓</span> {index + 1}. {block.title}
            </li>
          ))}
          {player.currentIndex === 0 && player.mode !== 'complete' && (
            <li className="pp-queue-empty">아직 완료된 블록이 없습니다</li>
          )}
        </ul>
      </div>
    </section>
  );
}
