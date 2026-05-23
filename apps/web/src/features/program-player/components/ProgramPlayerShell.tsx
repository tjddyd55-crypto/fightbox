import type { ProgramPlayerViewMode } from '../types/programPlayer.types';
import type { MockProgramPlayerState } from '../hooks/useMockProgramPlayerState';
import { ProgramCoachView } from './ProgramCoachView';
import { ProgramDisplayView } from './ProgramDisplayView';
import { ProgramQueueView } from './ProgramQueueView';
import { ProgramSingleView } from './ProgramSingleView';

interface ProgramPlayerShellProps {
  view: ProgramPlayerViewMode;
  player: MockProgramPlayerState;
}

export function ProgramPlayerShell({ view, player }: ProgramPlayerShellProps) {
  switch (view) {
    case 'display':
      return <ProgramDisplayView player={player} />;
    case 'coach':
      return <ProgramCoachView player={player} />;
    case 'queue':
      return <ProgramQueueView player={player} />;
    case 'single':
    default:
      return <ProgramSingleView player={player} />;
  }
}
