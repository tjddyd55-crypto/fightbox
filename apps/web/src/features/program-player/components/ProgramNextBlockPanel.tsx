import { formatDuration } from '../../workout-program-builder/utils/durationUtils';
import type { ProgramPlayerBlock } from '../types/programPlayer.types';

interface ProgramNextBlockPanelProps {
  block: ProgramPlayerBlock | null;
  variant?: 'default' | 'large';
}

export function ProgramNextBlockPanel({ block, variant = 'default' }: ProgramNextBlockPanelProps) {
  return (
    <aside className={`pp-next-panel pp-next-panel--${variant}`}>
      <p className="pp-panel-label">다음</p>
      {block ? (
        <>
          <h3 className="pp-next-title">{block.title}</h3>
          <p className="pp-next-duration">{formatDuration(block.durationSec)}</p>
        </>
      ) : (
        <p className="pp-next-empty">마지막 블록입니다</p>
      )}
    </aside>
  );
}
