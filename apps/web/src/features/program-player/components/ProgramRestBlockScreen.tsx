import { formatDuration } from '../../workout-program-builder/utils/durationUtils';
import type { ProgramPlayerBlock } from '../types/programPlayer.types';

interface ProgramRestBlockScreenProps {
  block: ProgramPlayerBlock;
  remainingSec: number;
  nextBlock: ProgramPlayerBlock | null;
  variant?: 'default' | 'display';
}

export function ProgramRestBlockScreen({
  block,
  remainingSec,
  nextBlock,
  variant = 'default',
}: ProgramRestBlockScreenProps) {
  return (
    <section className={`pp-rest-screen pp-rest-screen--${variant}`}>
      <div className="pp-rest-card">
        <p className="pp-rest-label">휴식</p>
        <p className="pp-rest-timer">{formatDuration(remainingSec)}</p>
        <p className="pp-rest-next">
          다음 운동 · {nextBlock?.title ?? block.subtitle ?? '준비'}
        </p>
      </div>
    </section>
  );
}
