import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMockProgramPlayerState } from '../hooks/useMockProgramPlayerState';
import { ProgramPlayerShell } from '../components/ProgramPlayerShell';
import type { ProgramPlayerViewMode } from '../types/programPlayer.types';
import '../programPlayer.css';

function parseViewMode(value: string | null): ProgramPlayerViewMode {
  if (value === 'display' || value === 'coach' || value === 'queue' || value === 'single') {
    return value;
  }
  return 'single';
}

export function ProgramPlayerDemoPage() {
  const [searchParams] = useSearchParams();
  const view = useMemo(() => parseViewMode(searchParams.get('view')), [searchParams]);
  const player = useMockProgramPlayerState();

  return (
    <main className="pp-root">
      {!player.isBroadcastSupported && (
        <p className="pp-broadcast-fallback" role="status">
          BroadcastChannel을 사용할 수 없어 각 창이 독립적으로 동작합니다.
        </p>
      )}
      <ProgramPlayerShell view={view} player={player} />
    </main>
  );
}
