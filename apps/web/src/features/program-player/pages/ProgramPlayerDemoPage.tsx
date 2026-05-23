import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProgramPlayerExperience } from '../components/ProgramPlayerExperience';
import { useMockProgramPlayerState } from '../hooks/useMockProgramPlayerState';
import { parseProgramPlayerView } from '../utils/programPlayerViewUtils';
import '../programPlayer.css';

export function ProgramPlayerDemoPage() {
  const [searchParams] = useSearchParams();
  const view = useMemo(() => parseProgramPlayerView(searchParams.get('view')), [searchParams]);
  const player = useMockProgramPlayerState();

  return (
    <main className="pp-root">
      {!player.isBroadcastSupported && (
        <p className="pp-broadcast-fallback" role="status">
          BroadcastChannel을 사용할 수 없어 각 창이 독립적으로 동작합니다.
        </p>
      )}
      <ProgramPlayerExperience
        view={view}
        player={player}
        multiScreenBasePath="/program-player-demo"
        allowCoachQueue
      />
    </main>
  );
}
