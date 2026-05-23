import { formatDuration } from '../../workout-program-builder/utils/durationUtils';
import type { ProgramPlayerBlock } from '../types/programPlayer.types';

interface ProgramCurrentBlockPanelProps {
  block: ProgramPlayerBlock | null;
  remainingSec: number;
  variant?: 'default' | 'large';
}

export function ProgramCurrentBlockPanel({
  block,
  remainingSec,
  variant = 'default',
}: ProgramCurrentBlockPanelProps) {
  if (!block) return null;

  return (
    <aside className={`pp-current-panel pp-current-panel--${variant}`}>
      <p className="pp-panel-label">현재 블록</p>
      <h2 className="pp-panel-title">{block.title}</h2>
      <p className="pp-panel-timer">{formatDuration(remainingSec)}</p>
      <p className="pp-panel-type">{block.type === 'video' ? '운동' : block.type === 'rest' ? '휴식' : '카운트다운'}</p>
    </aside>
  );
}
