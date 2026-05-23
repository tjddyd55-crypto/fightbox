import type { ProgramPlayerState } from '../hooks/useProgramPlayerState';
import { ProgramCompleteScreen } from './ProgramCompleteScreen';
import { ProgramCountdownBlockScreen } from './ProgramCountdownBlockScreen';
import { ProgramRestBlockScreen } from './ProgramRestBlockScreen';
import { ProgramStartScreen } from './ProgramStartScreen';
import { ProgramVideoBlockScreen } from './ProgramVideoBlockScreen';

interface ProgramBlockContentProps {
  player: ProgramPlayerState;
  variant?: 'default' | 'display';
}

export function ProgramBlockContent({ player, variant = 'default' }: ProgramBlockContentProps) {
  if (player.mode === 'start') {
    return <ProgramStartScreen player={player} />;
  }

  if (player.mode === 'complete') {
    return <ProgramCompleteScreen player={player} />;
  }

  if (!player.currentBlock) {
    return null;
  }

  if (player.mode === 'rest') {
    return (
      <ProgramRestBlockScreen
        block={player.currentBlock}
        remainingSec={player.remainingSec}
        nextBlock={player.nextBlock}
        variant={variant}
      />
    );
  }

  if (player.mode === 'countdown') {
    return (
      <ProgramCountdownBlockScreen
        block={player.currentBlock}
        remainingSec={player.remainingSec}
        nextBlock={player.nextBlock}
        variant={variant}
      />
    );
  }

  return (
    <ProgramVideoBlockScreen
      block={player.currentBlock}
      remainingSec={player.remainingSec}
      nextBlock={player.nextBlock}
      elapsedSec={player.elapsedSec}
      variant={variant}
    />
  );
}
