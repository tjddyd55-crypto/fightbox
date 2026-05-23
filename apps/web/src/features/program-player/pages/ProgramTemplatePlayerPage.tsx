import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  ProgramPlayerErrorState,
  ProgramPlayerExperience,
  ProgramPlayerLoadingState,
} from '../components/ProgramPlayerExperience';
import { useProgramPlayerState } from '../hooks/useProgramPlayerState';
import {
  loadProgramFromTemplateId,
  ProgramTemplateLoadError,
} from '../services/programTemplateLoader';
import type { ProgramPlayerProgram } from '../types/programPlayer.types';
import { parseProgramPlayerView } from '../utils/programPlayerViewUtils';
import '../programPlayer.css';

function ProgramTemplatePlayerInner({
  program,
  view,
  multiScreenBasePath,
}: {
  program: ProgramPlayerProgram;
  view: ReturnType<typeof parseProgramPlayerView>;
  multiScreenBasePath: string;
}) {
  const player = useProgramPlayerState(program);

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
        multiScreenBasePath={multiScreenBasePath}
        allowCoachQueue
      />
    </main>
  );
}

export function ProgramTemplatePlayerPage() {
  const { templateId = '' } = useParams();
  const [searchParams] = useSearchParams();
  const view = useMemo(() => parseProgramPlayerView(searchParams.get('view')), [searchParams]);
  const multiScreenBasePath = `/programs/${encodeURIComponent(templateId)}/play`;

  const [program, setProgram] = useState<ProgramPlayerProgram | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setErrorMessage(null);
      setProgram(null);

      try {
        const loaded = await loadProgramFromTemplateId(templateId);
        if (!cancelled) {
          setProgram(loaded);
        }
      } catch (error) {
        if (cancelled) return;
        if (error instanceof ProgramTemplateLoadError) {
          setErrorMessage(error.message);
        } else {
          setErrorMessage('프로그램을 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [templateId]);

  if (isLoading) {
    return <ProgramPlayerLoadingState />;
  }

  if (errorMessage || !program) {
    return <ProgramPlayerErrorState message={errorMessage ?? '프로그램을 불러오지 못했습니다.'} />;
  }

  return (
    <ProgramTemplatePlayerInner
      program={program}
      view={view}
      multiScreenBasePath={multiScreenBasePath}
    />
  );
}
