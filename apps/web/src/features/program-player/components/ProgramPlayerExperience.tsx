import type { ProgramPlayerViewMode } from '../types/programPlayer.types';
import type { ProgramPlayerState } from '../hooks/useProgramPlayerState';
import { ProgramPlayerShell } from '../components/ProgramPlayerShell';

interface ProgramPlayerExperienceProps {
  view: ProgramPlayerViewMode;
  player: ProgramPlayerState;
  multiScreenBasePath?: string;
  allowCoachQueue?: boolean;
}

export function ProgramPlayerExperience({
  view,
  player,
  multiScreenBasePath,
  allowCoachQueue = true,
}: ProgramPlayerExperienceProps) {
  const resolvedView =
    !allowCoachQueue && (view === 'coach' || view === 'queue') ? 'single' : view;

  return (
    <ProgramPlayerShell
      view={resolvedView}
      player={player}
      multiScreenBasePath={multiScreenBasePath}
      allowCoachQueue={allowCoachQueue}
    />
  );
}

export function ProgramPlayerLoadingState() {
  return (
    <main className="pp-root">
      <p className="pp-status-message">프로그램을 불러오는 중…</p>
    </main>
  );
}

export function ProgramPlayerErrorState({ message }: { message: string }) {
  return (
    <main className="pp-root">
      <p className="pp-status-message pp-status-message--error" role="alert">
        {message}
      </p>
    </main>
  );
}
