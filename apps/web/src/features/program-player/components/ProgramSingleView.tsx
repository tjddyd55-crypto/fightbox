import { useRef } from 'react';
import type { MockProgramPlayerState } from '../hooks/useMockProgramPlayerState';
import { ProgramBlockContent } from './ProgramBlockContent';
import { ProgramBlockTimeline } from './ProgramBlockTimeline';
import { ProgramCurrentBlockPanel } from './ProgramCurrentBlockPanel';
import { ProgramMultiScreenLauncher } from './ProgramMultiScreenLauncher';
import { ProgramNextBlockPanel } from './ProgramNextBlockPanel';
import { ProgramPlayerControls, useProgramPlayerKeyboard } from './ProgramPlayerControls';
import { ProgramProgressHeader } from './ProgramProgressHeader';

interface ProgramSingleViewProps {
  player: MockProgramPlayerState;
}

export function ProgramSingleView({ player }: ProgramSingleViewProps) {
  const rootRef = useRef<HTMLElement>(null);
  useProgramPlayerKeyboard(player, rootRef);

  const showSidePanel =
    player.mode !== 'start' && player.mode !== 'complete' && player.currentBlock;

  return (
    <section ref={rootRef} className="pp-single-view">
      <ProgramProgressHeader player={player} showControlsHint />
      <div className="pp-single-main">
        <div className="pp-single-stage">
          <ProgramBlockContent player={player} />
        </div>
        {showSidePanel && (
          <aside className="pp-single-side">
            <ProgramCurrentBlockPanel
              block={player.currentBlock}
              remainingSec={player.remainingSec}
            />
            <ProgramNextBlockPanel block={player.nextBlock} />
          </aside>
        )}
      </div>
      {player.mode !== 'start' && player.mode !== 'complete' && (
        <div className="pp-single-timeline-row">
          <ProgramBlockTimeline player={player} compact />
        </div>
      )}
      <ProgramPlayerControls player={player} rootRef={rootRef} size="large" />
      <ProgramMultiScreenLauncher
        showFullscreen
        onFullscreen={() => void rootRef.current?.requestFullscreen()}
      />
    </section>
  );
}
