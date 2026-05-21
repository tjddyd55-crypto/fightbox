import { useCallback, useState } from 'react';
import { BuilderHeader } from '../components/BuilderHeader';
import {
  BuilderSidebar,
  type BuilderSidebarActiveSection,
  type BuilderSidebarSection,
} from '../components/BuilderSidebar';
import { BottomActionBar } from '../components/BottomActionBar';
import { MobileBuilderTabs, type MobileBuilderTab } from '../components/MobileBuilderTabs';
import { ProgramTimelinePanel } from '../components/ProgramTimelinePanel';
import { SelectedBlockPanel } from '../components/SelectedBlockPanel';
import { ShareSubmissionModal } from '../components/ShareSubmissionModal';
import { TemplateLibraryModal } from '../components/TemplateLibraryModal';
import { TestPlaybackModal } from '../components/TestPlaybackModal';
import { VideoEditModal } from '../components/VideoEditModal';
import { VideoLibraryPanel } from '../components/VideoLibraryPanel';
import { VideoUploadModal } from '../components/VideoUploadModal';
import type { WorkoutVideo } from '../types/workoutProgramBuilder.types';
import { useProgramBuilderState } from '../hooks/useProgramBuilderState';
import { useVideoLibraryFilters } from '../hooks/useVideoLibraryFilters';
import { isCompactLayout } from '../utils/viewportUtils';
import { validateProgramBlocks } from '../utils/programValidationUtils';
import '../workoutProgramBuilder.css';

const PANEL_IDS = {
  timeline: 'wpb-mobile-panel-timeline',
  videos: 'wpb-mobile-panel-videos',
  settings: 'wpb-mobile-panel-settings',
} as const;

function focusBuilderPanel(panelId: string, preferSearchInput = false): void {
  const panel = document.getElementById(panelId);
  if (!panel) {
    return;
  }

  panel.scrollIntoView({ behavior: 'smooth', block: 'start' });

  if (preferSearchInput) {
    const searchInput = panel.querySelector<HTMLInputElement>('input[type="search"]');
    if (searchInput) {
      searchInput.focus();
      return;
    }
  }

  const heading = panel.querySelector('h2');
  if (heading instanceof HTMLElement) {
    if (!heading.hasAttribute('tabindex')) {
      heading.tabIndex = -1;
    }
    heading.focus({ preventScroll: true });
  }
}

export function WorkoutProgramBuilderPage() {
  const state = useProgramBuilderState();
  const videoFilterState = useVideoLibraryFilters(state.videos);
  const [mobileTab, setMobileTab] = useState<MobileBuilderTab>('timeline');
  const [activeSidebarSection, setActiveSidebarSection] =
    useState<BuilderSidebarActiveSection>('builder');
  const [isTemplateLibraryOpen, setIsTemplateLibraryOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isVideoUploadOpen, setIsVideoUploadOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<WorkoutVideo | null>(null);
  const { setSelectedBlockId, selectedBlockId, showMessage } = state;

  const handleEditVideo = useCallback((video: WorkoutVideo) => {
    setEditingVideo(video);
  }, []);

  const handleDeleteVideo = useCallback(
    (video: WorkoutVideo) => {
      const confirmed = window.confirm(`「${video.title}」 영상을 삭제할까요?`);
      if (!confirmed) return;
      if (!state.deleteRegisteredVideo(video.id)) return;
      if (videoFilterState.selectedVideoId === video.id) {
        videoFilterState.setSelectedVideoId(null);
      }
    },
    [state, videoFilterState],
  );

  const handleSelectBlock = useCallback(
    (id: string) => {
      setSelectedBlockId(id);
      setActiveSidebarSection('settings');
      if (isCompactLayout()) {
        setMobileTab('settings');
      }
    },
    [setSelectedBlockId],
  );

  const handleSidebarNavigate = useCallback(
    (section: BuilderSidebarSection) => {
      if (section === 'templates') {
        setIsTemplateLibraryOpen(true);
        return;
      }

      if (section === 'settings' && !selectedBlockId) {
        showMessage('설정할 블록을 먼저 선택해 주세요.');
        return;
      }

      if (isCompactLayout()) {
        if (section === 'builder') {
          setMobileTab('timeline');
        } else if (section === 'videos') {
          setMobileTab('videos');
        } else if (section === 'settings') {
          setMobileTab('settings');
        }
      } else {
        if (section === 'builder') {
          focusBuilderPanel(PANEL_IDS.timeline);
        } else if (section === 'videos') {
          focusBuilderPanel(PANEL_IDS.videos, true);
        } else {
          focusBuilderPanel(PANEL_IDS.settings);
        }
      }

      setActiveSidebarSection(section);
    },
    [selectedBlockId, showMessage],
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
      setActiveSidebarSection('builder');
    },
    [state],
  );

  return (
    <main className="wpb-root">
      <BuilderHeader template={state.template} totalDurationSec={state.totalDurationSec} />
      <MobileBuilderTabs activeTab={mobileTab} onTabChange={setMobileTab} />
      <section className="wpb-body">
        <BuilderSidebar
          activeSection={activeSidebarSection}
          onNavigate={handleSidebarNavigate}
        />
        <section
          className={`wpb-main wpb-main--mobile-tab-${mobileTab}`}
          aria-label="프로그램 빌더 작업 영역"
        >
          <VideoLibraryPanel
            videos={state.videos}
            filterState={videoFilterState}
            onAddVideo={handleAddVideo}
            onOpenUpload={() => setIsVideoUploadOpen(true)}
            onEditVideo={handleEditVideo}
            onDeleteVideo={handleDeleteVideo}
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
        onPublicShare={
          state.template.visibility === 'public_pending'
            ? undefined
            : () => setIsShareModalOpen(true)
        }
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
      <VideoUploadModal
        isOpen={isVideoUploadOpen}
        onClose={() => setIsVideoUploadOpen(false)}
        onSubmit={(input) => {
          const created = state.registerVideo(input);
          if (!created) return false;
          videoFilterState.setSelectedVideoId(created.id);
          if (isCompactLayout()) {
            setMobileTab('videos');
          }
          setIsVideoUploadOpen(false);
          return true;
        }}
      />
      <VideoEditModal
        video={editingVideo}
        isOpen={editingVideo !== null}
        onClose={() => setEditingVideo(null)}
        onSubmit={(videoId, input) => {
          const ok = state.updateRegisteredVideo(videoId, input);
          if (!ok) return false;
          setEditingVideo(null);
          return true;
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
