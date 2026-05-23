import type { ProgramPlayerBlock } from '../types/programPlayer.types';

interface ProgramCountdownBlockScreenProps {
  block: ProgramPlayerBlock;
  remainingSec: number;
  nextBlock: ProgramPlayerBlock | null;
  variant?: 'default' | 'display';
}

export function ProgramCountdownBlockScreen({
  block,
  remainingSec,
  nextBlock,
  variant = 'default',
}: ProgramCountdownBlockScreenProps) {
  const displayNumber = Math.max(1, remainingSec);

  return (
    <section className={`pp-countdown-screen pp-countdown-screen--${variant}`}>
      <div className="pp-countdown-card">
        <p className="pp-countdown-label">곧 시작합니다!</p>
        <p className="pp-countdown-number">{displayNumber}</p>
        <p className="pp-countdown-next">다음 · {nextBlock?.title ?? block.subtitle ?? '운동'}</p>
      </div>
    </section>
  );
}
