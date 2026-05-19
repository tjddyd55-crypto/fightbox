import { useCallback, useState } from 'react';
import { BuilderHeader } from '../components/BuilderHeader';
import { BuilderSidebar } from '../components/BuilderSidebar';
import { BottomActionBar } from '../components/BottomActionBar';
import { MobileBuilderTabs, type MobileBuilderTab } from '../components/MobileBuilderTabs';
import { ProgramTimelinePanel } from '../components/ProgramTimelinePanel';
import { SelectedBlockPanel } from '../components/SelectedBlockPanel';
import { TestPlaybackModal } from '../components/TestPlaybackModal';
import { VideoLibraryPanel } from '../components/VideoLibraryPanel';
import { useProgramBuilderState } from '../hooks/useProgramBuilderState';
import { isCompactLayout } from '../utils/viewportUtils';
import '../workoutProgramBuilder.css';

export function WorkoutProgramBuilderPage() {
  const state = useProgramBuilderState();
  const [mobileTab, setMobileTab] = useState<MobileBuilderTab>('timeline');
  const { setSelectedBlockId } = state;

  const handleSelectBlock = useCallback(
    (id: string) => {
      setSelectedBlockId(id);
      if (isCompactLayout()) {
        setMobileTab('settings');
      }
    },
    [setSelectedBlockId],
  );

  return (
    <main className="wpb-root">
      <BuilderHeader template={state.template} totalDurationSec={state.totalDurationSec} />
      <MobileBuilderTabs activeTab={mobileTab} onTabChange={setMobileTab} />
      <section className="wpb-body">
        <BuilderSidebar />
        <section
          className={`wpb-main wpb-main--mobile-tab-${mobileTab}`}
          aria-label="프로그램 빌더 작업 영역"
        >
          <VideoLibraryPanel videos={state.videos} onAddVideo={state.addVideoToTimeline} />
          <ProgramTimelinePanel
            blocks={state.blocks}
            selectedBlockId={state.selectedBlockId}
            totalDurationSec={state.totalDurationSec}
            onSelectBlock={handleSelectBlock}
            onMoveBlock={state.moveBlock}
            onRemoveBlock={state.removeBlock}
            onDragReorder={state.handleDragReorder}
            onAddRest={state.addRestBlock}
            onAddCountdown={state.addCountdownBlock}
          />
          <SelectedBlockPanel
            selectedBlock={state.selectedBlock}
            videos={state.videos}
            onUpdateBlock={state.updateBlock}
            onUpdateVideoSettings={state.updateVideoBlockSettings}
          />
        </section>
      </section>
      <BottomActionBar
        totalDurationSec={state.totalDurationSec}
        onPreview={() =>
          state.showMessage(
            state.selectedBlock
              ? `「${state.selectedBlock.title}」 구간 미리보기`
              : '선택된 블록이 없습니다.',
          )
        }
        onSaveTemplate={() => state.saveTemplate()}
        onCopySave={() => state.showMessage('복사본으로 저장되었습니다.')}
        onTestPlay={() => state.setIsTestPlaying(true)}
      />
      {state.statusMessage && (
        <p className="wpb-status-toast" role="status">
          {state.statusMessage}
        </p>
      )}
      {state.isTestPlaying && (
        <TestPlaybackModal
          blocks={state.blocks}
          totalDurationSec={state.totalDurationSec}
          initialBlockId={state.selectedBlockId}
          videos={state.videos}
          onClose={() => state.setIsTestPlaying(false)}
        />
      )}
    </main>
  );
}
