import { formatDuration } from '../../workout-program-builder/utils/durationUtils';
import type { ProgramPlayerState } from '../hooks/useProgramPlayerState';

interface ProgramBlockTimelineProps {
  player: ProgramPlayerState;
  onSelectBlock?: (index: number) => void;
  compact?: boolean;
}

function blockTypeLabel(type: string): string {
  if (type === 'rest') return '휴식';
  if (type === 'countdown') return '카운트';
  return '운동';
}

export function ProgramBlockTimeline({
  player,
  onSelectBlock,
  compact = false,
}: ProgramBlockTimelineProps) {
  return (
    <div className={`pp-block-timeline${compact ? ' pp-block-timeline--compact' : ''}`}>
      {player.blocks.map((block, index) => {
        const isCurrent = index === player.currentIndex && player.mode !== 'start' && player.mode !== 'complete';
        const isDone = index < player.currentIndex || player.mode === 'complete';
        return (
          <button
            key={block.id}
            type="button"
            className={`pp-block-card${isCurrent ? ' is-current' : ''}${isDone ? ' is-done' : ''}`}
            onClick={() => onSelectBlock?.(index)}
            disabled={!onSelectBlock}
          >
            <span className="pp-block-card-index">{index + 1}</span>
            <span className="pp-block-card-body">
              <strong>{block.title}</strong>
              <span>
                {blockTypeLabel(block.type)} · {formatDuration(block.durationSec)}
              </span>
            </span>
            {isDone && <span className="pp-block-card-check" aria-hidden="true">✓</span>}
          </button>
        );
      })}
    </div>
  );
}
