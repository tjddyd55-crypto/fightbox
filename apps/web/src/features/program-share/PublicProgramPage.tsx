import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { PublishedProgramPlaybackItemDto, PublishedProgramShareDto } from '@fightbox/shared';
import { formatDuration } from '../workout-program-builder/utils/durationUtils';
import { getSharedProgram, ProgramShareApiError } from './programShareApiClient';
import { PublicProgramPlayer } from './PublicProgramPlayer';
import './programShare.css';

function findInitialItem(items: PublishedProgramPlaybackItemDto[]): PublishedProgramPlaybackItemDto | null {
  const playable = items.find((item) => Boolean(item.playbackUrl));
  return playable ?? items[0] ?? null;
}

export function PublicProgramPage() {
  const { shareToken = '' } = useParams();
  const [program, setProgram] = useState<PublishedProgramShareDto | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
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
      setProgram(data);
      const initial = findInitialItem(data.playbackItems);
      setSelectedBlockId(initial?.blockId ?? null);
    } catch (error) {
      if (error instanceof ProgramShareApiError && error.status === 404) {
        setErrorMessage('공유가 비활성화되었거나 프로그램을 찾을 수 없습니다.');
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

  const selectedItem = useMemo(() => {
    if (!program) {
      return null;
    }
    if (selectedBlockId) {
      return program.playbackItems.find((item) => item.blockId === selectedBlockId) ?? null;
    }
    return findInitialItem(program.playbackItems);
  }, [program, selectedBlockId]);

  if (isLoading) {
    return (
      <main className="public-program-page">
        <div className="public-program-shell">
          <p className="public-program-status">프로그램을 불러오는 중…</p>
        </div>
      </main>
    );
  }

  if (errorMessage || !program) {
    return (
      <main className="public-program-page">
        <div className="public-program-shell">
          <header className="public-program-header">
            <p className="public-program-brand">Fightbox</p>
            <h1>공유 프로그램</h1>
          </header>
          <p className="public-program-status public-program-status--error" role="alert">
            {errorMessage ?? '프로그램을 찾을 수 없습니다.'}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="public-program-page">
      <div className="public-program-shell">
        <header className="public-program-header">
          <p className="public-program-brand">Fightbox</p>
          <h1>{program.title}</h1>
          {program.description && <p className="public-program-description">{program.description}</p>}
          <p className="public-program-meta">
            총 {formatDuration(program.totalDurationSec)} · 운동 {program.playbackItems.length}개
          </p>
        </header>

        <div className="public-program-layout">
          <section className="public-program-player-panel" aria-label="영상 재생">
            <PublicProgramPlayer item={selectedItem} />
          </section>

          <section className="public-program-timeline-panel" aria-label="운동 순서">
            <h2>운동 순서</h2>
            <ol className="public-program-timeline">
              {program.playbackItems.map((item, index) => {
                const isActive = item.blockId === selectedItem?.blockId;
                return (
                  <li key={item.blockId}>
                    <button
                      type="button"
                      className={`public-program-timeline-item${isActive ? ' is-active' : ''}`}
                      onClick={() => setSelectedBlockId(item.blockId)}
                    >
                      <span className="public-program-timeline-index">{index + 1}</span>
                      <span className="public-program-timeline-body">
                        <strong>{item.title}</strong>
                        <span>{formatDuration(item.durationSec)}</span>
                        {!item.playbackUrl && (
                          <span className="public-program-timeline-note">영상 없음</span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>
        </div>

        <footer className="public-program-footer">
          <p>Fightbox · 체육관 운동 프로그램</p>
        </footer>
      </div>
    </main>
  );
}
