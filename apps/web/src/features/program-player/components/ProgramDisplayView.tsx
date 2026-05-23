import { useRef, useState } from 'react';
import type { MockProgramPlayerState } from '../hooks/useMockProgramPlayerState';
import { ProgramBlockContent } from './ProgramBlockContent';
import { ProgramCurrentBlockPanel } from './ProgramCurrentBlockPanel';
import { ProgramNextBlockPanel } from './ProgramNextBlockPanel';
import { ProgramPlayerControls } from './ProgramPlayerControls';
import { ProgramProgressHeader } from './ProgramProgressHeader';

interface ProgramDisplayViewProps {
  player: MockProgramPlayerState;
}

export function ProgramDisplayView({ player }: ProgramDisplayViewProps) {
  const rootRef = useRef<HTMLElement>(null);
  const [controlsVisible, setControlsVisible] = useState(false);

  const showSidePanel =
    player.mode !== 'start' && player.mode !== 'complete' && player.currentBlock;

  return (
    <section
      ref={rootRef}
      className="pp-display-view"
      onMouseEnter={() => setControlsVisible(true)}
      onMouseLeave={() => setControlsVisible(false)}
    >
      <ProgramProgressHeader player={player} variant="large" />
      <div className="pp-display-main">
        <div className="pp-display-stage">
          <ProgramBlockContent player={player} variant="display" />
        </div>
        {showSidePanel && (
          <aside className="pp-display-side">
            <ProgramCurrentBlockPanel
              block={player.currentBlock}
              remainingSec={player.remainingSec}
              variant="large"
            />
            <ProgramNextBlockPanel block={player.nextBlock} variant="large" />
          </aside>
        )}
      </div>
      <div className={`pp-display-controls${controlsVisible ? ' is-visible' : ''}`}>
        <ProgramPlayerControls
          player={player}
          rootRef={rootRef}
          size="minimal"
          showFullscreen
        />
      </div>
    </section>
  );
}
