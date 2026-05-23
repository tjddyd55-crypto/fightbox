import { formatDuration } from '../../workout-program-builder/utils/durationUtils';
import type { ProgramPlayerBlock } from '../types/programPlayer.types';

interface ProgramVideoBlockScreenProps {
  block: ProgramPlayerBlock;
  remainingSec: number;
  nextBlock: ProgramPlayerBlock | null;
  elapsedSec: number;
  variant?: 'default' | 'display';
}

export function ProgramVideoBlockScreen({
  block,
  remainingSec,
  nextBlock,
  elapsedSec,
  variant = 'default',
}: ProgramVideoBlockScreenProps) {
  const progress = block.durationSec > 0 ? (elapsedSec / block.durationSec) * 100 : 0;

  return (
    <section className={`pp-video-screen pp-video-screen--${variant}`}>
      <div className="pp-video-stage">
        <div className="pp-video-placeholder" aria-hidden="true">
          <span className="pp-video-placeholder-icon">▶</span>
        </div>
        <div className="pp-video-fake-progress">
          <div className="pp-video-fake-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <div className="pp-video-info">
        <h2 className="pp-video-title">{block.title}</h2>
        <p className="pp-video-timer">{formatDuration(remainingSec)}</p>
        {nextBlock && <p className="pp-video-next">다음 · {nextBlock.title}</p>}
      </div>
    </section>
  );
}
