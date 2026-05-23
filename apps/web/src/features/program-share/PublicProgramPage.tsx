import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  ProgramPlayerErrorState,
  ProgramPlayerExperience,
  ProgramPlayerLoadingState,
} from '../program-player/components/ProgramPlayerExperience';
import { useProgramPlayerState } from '../program-player/hooks/useProgramPlayerState';
import { programFromPublishedShare } from '../program-player/utils/programPlayerDataAdapter';
import { parseShareProgramPlayerView } from '../program-player/utils/programPlayerViewUtils';
import type { ProgramPlayerProgram } from '../program-player/types/programPlayer.types';
import { getSharedProgram, ProgramShareApiError } from './programShareApiClient';
import '../program-player/programPlayer.css';

function PublicProgramPlayerInner({
  program,
  view,
  shareToken,
}: {
  program: ProgramPlayerProgram;
  view: ReturnType<typeof parseShareProgramPlayerView>;
  shareToken: string;
}) {
  const player = useProgramPlayerState(program);
  const multiScreenBasePath = `/share/programs/${encodeURIComponent(shareToken)}`;

  return (
    <main className="pp-root pp-root--public">
      {!player.isBroadcastSupported && (
        <p className="pp-broadcast-fallback" role="status">
          BroadcastChannel을 사용할 수 없어 각 창이 독립적으로 동작합니다.
        </p>
      )}
      <ProgramPlayerExperience
        view={view}
        player={player}
        multiScreenBasePath={multiScreenBasePath}
        allowCoachQueue={false}
      />
    </main>
  );
}

export function PublicProgramPage() {
  const { shareToken = '' } = useParams();
  const [searchParams] = useSearchParams();
  const view = useMemo(() => parseShareProgramPlayerView(searchParams.get('view')), [searchParams]);

  const [program, setProgram] = useState<ProgramPlayerProgram | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadProgram = useCallback(async () => {
    const token = shareToken.trim();
    if (!token) {
      setErrorMessage('공유 링크가 올바르지 않습니다.');
      setProgram(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const data = await getSharedProgram(token);
      const playerProgram = programFromPublishedShare(data);
      if (playerProgram.blocks.length === 0) {
        setErrorMessage('실행할 블록이 없습니다.');
        setProgram(null);
        return;
      }
      setProgram(playerProgram);
    } catch (error) {
      if (error instanceof ProgramShareApiError && error.status === 404) {
        setErrorMessage('공유가 종료되었거나 존재하지 않는 프로그램입니다.');
      } else if (error instanceof ProgramShareApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('프로그램을 불러오지 못했습니다.');
      }
      setProgram(null);
    } finally {
      setIsLoading(false);
    }
  }, [shareToken]);

  useEffect(() => {
    void loadProgram();
  }, [loadProgram]);

  if (isLoading) {
    return <ProgramPlayerLoadingState />;
  }

  if (errorMessage || !program) {
    return <ProgramPlayerErrorState message={errorMessage ?? '프로그램을 찾을 수 없습니다.'} />;
  }

  return <PublicProgramPlayerInner program={program} view={view} shareToken={shareToken.trim()} />;
}
