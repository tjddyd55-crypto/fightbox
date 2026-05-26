import { useEffect } from 'react';
import type { ProgramPlayerBlock } from '../types/programPlayer.types';
import { speakMessage } from '../../workout-program-builder/utils/speechSynthesisUtils';

interface ProgramCountdownBlockScreenProps {
  block: ProgramPlayerBlock;
  remainingSec: number;
  nextBlock: ProgramPlayerBlock | null;
  isPlaying: boolean;
  variant?: 'default' | 'display';
}

export function ProgramCountdownBlockScreen({
  block,
  remainingSec,
  nextBlock,
  isPlaying,
  variant = 'default',
}: ProgramCountdownBlockScreenProps) {
  const displayNumber = Math.max(1, Math.ceil(remainingSec));
  const message = block.message ?? block.description ?? '준비하세요';

  useEffect(() => {
    if (isPlaying && remainingSec === block.durationSec) {
      speakMessage(message);
    }
  }, [block.id, isPlaying, message, remainingSec, block.durationSec]);

  return (
    <section className={`pp-countdown-screen pp-countdown-screen--${variant}`}>
      <div className="pp-countdown-card">
        <p className="pp-countdown-label">{message}</p>
        <p className="pp-countdown-number">{displayNumber}</p>
        <p className="pp-countdown-next">다음 · {nextBlock?.title ?? block.subtitle ?? '운동'}</p>
      </div>
    </section>
  );
}
