import { useCallback, useState } from 'react';
import { BuilderHeader } from '../components/BuilderHeader';
import { BuilderSidebar } from '../components/BuilderSidebar';
import { BottomActionBar } from '../components/BottomActionBar';
import { MobileBuilderTabs, type MobileBuilderTab } from '../components/MobileBuilderTabs';
import { ProgramTimelinePanel } from '../components/ProgramTimelinePanel';
import { SelectedBlockPanel } from '../components/SelectedBlockPanel';
import { ShareSubmissionModal } from '../components/ShareSubmissionModal';
import { TemplateLibraryModal } from '../components/TemplateLibraryModal';
import { TestPlaybackModal } from '../components/TestPlaybackModal';
import { VideoLibraryPanel } from '../components/VideoLibraryPanel';
import { useProgramBuilderState } from '../hooks/useProgramBuilderState';
import { useVideoLibraryFilters } from '../hooks/useVideoLibraryFilters';
import { isCompactLayout } from '../utils/viewportUtils';
import { validateProgramBlocks } from '../utils/programValidationUtils';
import '../workoutProgramBuilder.css';

export function WorkoutProgramBuilderPage() {
  const state = useProgramBuilderState();
  const videoFilterState = useVideoLibraryFilters(state.videos);
  const [mobileTab, setMobileTab] = useState<MobileBuilderTab>('timeline');
  const [isTemplateLibraryOpen, setIsTemplateLibraryOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
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

  const handleAddVideo = useCallback(
    (video: (typeof state.videos)[number]) => {
      state.addVideoToTimeline(video);
      if (video.isPremium || (video.creditCost ?? 0) > 0) {
        state.showMessage(
          `「${video.title}」 추가됨 · 추후 ${video.creditCost ?? 0} 크레딧 차감 예정`,
        );
      } else {
        state.showMessage(`「${video.title}」이(가) 타임라인에 추가되었습니다.`);
      }
      if (isCompactLayout()) {
        setMobileTab('timeline');
      }
    },
    [state],
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
          <VideoLibraryPanel
            videos={state.videos}
            filterState={videoFilterState}
            onAddVideo={handleAddVideo}
          />
          <ProgramTimelinePanel
            blocks={state.blocks}
            videos={state.videos}
            selectedBlockId={state.selectedBlockId}
            totalDurationSec={state.totalDurationSec}
            onSelectBlock={handleSelectBlock}
            onMoveBlock={state.moveBlock}
            onRemoveBlock={state.removeBlock}
            onDragReorder={state.handleDragReorder}
            onAddRest={state.addRestBlock}
            onAddCountdown={state.addCountdownBlock}
            onAddVoice={state.addVoiceBlock}
            onDuplicateBlock={state.duplicateBlock}
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
        onOpenTemplateLibrary={() => setIsTemplateLibraryOpen(true)}
        onSaveTemplate={() => state.saveTemplate()}
        onCopySave={() => state.copyCurrentTemplate()}
        onPublicShare={() => setIsShareModalOpen(true)}
        onTestPlay={() => {
          const validation = validateProgramBlocks(state.blocks, state.videos);
          if (!validation.isValid) {
            const issue = validation.errors[0];
            state.showMessage(issue?.message ?? '테스트 재생할 수 없습니다.');
            if (issue?.blockId) {
              state.setSelectedBlockId(issue.blockId);
              if (isCompactLayout()) {
                setMobileTab('timeline');
              }
            }
            return;
          }
          state.setIsTestPlaying(true);
        }}
      />
      {state.statusMessage && (
        <p className="wpb-status-toast" role="status">
          {state.statusMessage}
        </p>
      )}
      <ShareSubmissionModal
        isOpen={isShareModalOpen}
        template={state.template}
        onClose={() => setIsShareModalOpen(false)}
        onSubmit={(payload) => {
          state.submitPublicShare(payload);
          setIsShareModalOpen(false);
        }}
      />
      <TemplateLibraryModal
        isOpen={isTemplateLibraryOpen}
        activeTemplateId={state.activeTemplateId}
        onClose={() => setIsTemplateLibraryOpen(false)}
        onLoad={(id) => {
          state.loadTemplate(id);
          setIsTemplateLibraryOpen(false);
        }}
        onCopy={(id) => {
          state.copyTemplateById(id);
          setIsTemplateLibraryOpen(false);
        }}
        onDelete={(id) => {
          state.deleteTemplate(id);
        }}
      />
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
