import { useRef } from 'react';
import type { MockProgramPlayerState } from '../hooks/useMockProgramPlayerState';
import { formatDuration } from '../../workout-program-builder/utils/durationUtils';
import { ProgramBlockTimeline } from './ProgramBlockTimeline';
import { ProgramMultiScreenLauncher } from './ProgramMultiScreenLauncher';
import { ProgramPlayerControls, useProgramPlayerKeyboard } from './ProgramPlayerControls';

interface ProgramCoachViewProps {
  player: MockProgramPlayerState;
}

export function ProgramCoachView({ player }: ProgramCoachViewProps) {
  const rootRef = useRef<HTMLElement>(null);
  useProgramPlayerKeyboard(player, rootRef);

  return (
    <section ref={rootRef} className="pp-coach-view">
      <header className="pp-coach-header">
        <div>
          <p className="pp-progress-brand">FIGHTBOX · COACH</p>
          <h1>{player.meta.title}</h1>
        </div>
        <div className="pp-coach-status">
          <span>
            {player.mode === 'start'
              ? '시작 전'
              : player.mode === 'complete'
                ? '완료'
                : `${player.currentIndex + 1} / ${player.blocks.length}`}
          </span>
          <span>{formatDuration(player.totalRemainingSec)} 남음</span>
          <span>{player.isPlaying ? '재생 중' : '일시정지'}</span>
        </div>
      </header>

      {player.currentBlock && player.mode !== 'start' && player.mode !== 'complete' && (
        <div className="pp-coach-current">
          <p>현재</p>
          <strong>{player.currentBlock.title}</strong>
          <span>{formatDuration(player.remainingSec)}</span>
        </div>
      )}

      <ProgramPlayerControls player={player} rootRef={rootRef} size="large" />

      <ProgramMultiScreenLauncher compact />

      <div className="pp-coach-list">
        <h2>전체 블록</h2>
        <ProgramBlockTimeline
          player={player}
          onSelectBlock={(index) => player.jumpToBlock(index)}
        />
      </div>
    </section>
  );
}
