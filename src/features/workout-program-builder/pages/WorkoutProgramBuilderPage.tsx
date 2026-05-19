import { BuilderHeader } from '../components/BuilderHeader';
import { BuilderSidebar } from '../components/BuilderSidebar';
import { BottomActionBar } from '../components/BottomActionBar';
import { ProgramTimelinePanel } from '../components/ProgramTimelinePanel';
import { SelectedBlockPanel } from '../components/SelectedBlockPanel';
import { TestPlaybackModal } from '../components/TestPlaybackModal';
import { VideoLibraryPanel } from '../components/VideoLibraryPanel';
import { useProgramBuilderState } from '../hooks/useProgramBuilderState';
import '../workoutProgramBuilder.css';

export function WorkoutProgramBuilderPage() {
  const state = useProgramBuilderState();

  return (
    <main className="wpb-root">
      <BuilderHeader template={state.template} totalDurationSec={state.totalDurationSec} />
      <section className="wpb-body">
        <BuilderSidebar />
        <section className="wpb-main">
          <VideoLibraryPanel videos={state.videos} onAddVideo={state.addVideoToTimeline} />
          <ProgramTimelinePanel
            blocks={state.blocks}
            selectedBlockId={state.selectedBlockId}
            totalDurationSec={state.totalDurationSec}
            onSelectBlock={state.setSelectedBlockId}
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
        onSaveTemplate={() => state.showMessage('템플릿이 저장되었습니다.')}
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
