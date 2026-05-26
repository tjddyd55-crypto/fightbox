import { formatPlayerTime } from '../utils/programPlayerTimeUtils';
import { formatActiveRepeatProgress } from '../utils/programPlayerPlaybackUtils';
import type { ProgramPlayerState } from '../hooks/useProgramPlayerState';

interface ProgramQueueViewProps {
  player: ProgramPlayerState;
}

export function ProgramQueueView({ player }: ProgramQueueViewProps) {
  const upcoming = player.blocks.slice(player.currentIndex + 1, player.currentIndex + 6);
  const isComplete = player.mode === 'complete';

  const activeRepeatLabel = formatActiveRepeatProgress(
    player.currentBlock,
    player.currentRepeatIndex,
  );

  return (
    <section className="pp-queue-view">
      <header className="pp-queue-header">
        <p className="pp-progress-brand">FIGHTBOX · QUEUE</p>
        <h1>{player.meta.title}</h1>
        <p className="pp-queue-progress">
          {isComplete
            ? '프로그램 완료 · 100%'
            : `진행률 ${player.progressPercent}% · ${formatPlayerTime(player.totalRemainingSec)} 남음`}
        </p>
      </header>

      {isComplete && (
        <div className="pp-queue-current pp-queue-current--complete">
          <p className="pp-queue-label">완료</p>
          <h2>모든 블록을 마쳤습니다</h2>
        </div>
      )}

      {player.currentBlock && !isComplete && player.mode !== 'start' && (
        <div className="pp-queue-current">
          <p className="pp-queue-label">현재</p>
          <h2>{player.currentBlock.title}</h2>
          <p className="pp-queue-timer">{formatPlayerTime(player.remainingSec)}</p>
          {activeRepeatLabel && <p className="pp-queue-repeat">{activeRepeatLabel}</p>}
        </div>
      )}

      <div className="pp-queue-upcoming">
        <h3>다음 운동</h3>
        <ol className="pp-queue-list">
          {isComplete || upcoming.length === 0 ? (
            <li className="pp-queue-empty">다음 블록이 없습니다</li>
          ) : (
            upcoming.map((block, offset) => (
              <li key={block.id} className="pp-queue-item">
                <span className="pp-queue-index">{player.currentIndex + offset + 2}</span>
                <div>
                  <strong>{block.title}</strong>
                  <span>{formatPlayerTime(block.durationSec)}</span>
                </div>
              </li>
            ))
          )}
        </ol>
      </div>

      <div className="pp-queue-done">
        <h3>완료</h3>
        <ul>
          {player.blocks.slice(0, player.completedBlockCount).map((block, index) => (
            <li key={block.id}>
              <span>✓</span> {index + 1}. {block.title}
            </li>
          ))}
          {player.completedBlockCount === 0 && !isComplete && (
            <li className="pp-queue-empty">아직 완료된 블록이 없습니다</li>
          )}
        </ul>
      </div>
    </section>
  );
}
