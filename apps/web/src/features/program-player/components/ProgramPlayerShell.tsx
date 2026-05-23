import type { ProgramPlayerViewMode } from '../types/programPlayer.types';
import type { ProgramPlayerState } from '../hooks/useProgramPlayerState';
import { ProgramCoachView } from './ProgramCoachView';
import { ProgramDisplayView } from './ProgramDisplayView';
import { ProgramQueueView } from './ProgramQueueView';
import { ProgramSingleView } from './ProgramSingleView';

interface ProgramPlayerShellProps {
  view: ProgramPlayerViewMode;
  player: ProgramPlayerState;
  multiScreenBasePath?: string;
  allowCoachQueue?: boolean;
}

export function ProgramPlayerShell({
  view,
  player,
  multiScreenBasePath,
  allowCoachQueue = true,
}: ProgramPlayerShellProps) {
  const launcherProps = { multiScreenBasePath, allowCoachQueue };

  switch (view) {
    case 'display':
      return <ProgramDisplayView player={player} />;
    case 'coach':
      return <ProgramCoachView player={player} {...launcherProps} />;
    case 'queue':
      return <ProgramQueueView player={player} />;
    case 'single':
    default:
      return <ProgramSingleView player={player} {...launcherProps} />;
  }
}
