/**
 * Program builder editing state.
 *
 * Owns: active template (blocks + metadata), selectedBlockId, toasts, test-play modal flag.
 * Does not own: layout/viewport, filter UI state (VideoLibraryPanel local), persistence (STEP 2+ storage).
 */
import { useCallback, useMemo, useState } from 'react';
import { mockProgramTemplate } from '../data/mockProgramTemplate';
import { mockWorkoutVideos } from '../data/mockWorkoutVideos';
import type {
  ProgramBlock,
  VideoProgramBlock,
  WorkoutProgramTemplate,
  WorkoutVideo,
} from '../types/workoutProgramBuilder.types';
import {
  deleteProgramTemplate as removeProgramTemplate,
  duplicateProgramTemplate,
  getProgramTemplateById,
  saveProgramTemplate as persistProgramTemplate,
} from '../storage/programTemplateStorage';
import {
  calculateTotalDurationSec,
  cloneBlocksWithNewIds,
  computeVideoBlockDuration,
  createVideoBlockFromWorkout,
  getVideoById,
  reindexBlocks,
  reorderBlocks,
} from '../utils/programTimelineUtils';

export function useProgramBuilderState() {
  const [template, setTemplate] = useState<WorkoutProgramTemplate>(() => ({
    ...mockProgramTemplate,
    blocks: [...mockProgramTemplate.blocks],
  }));
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(
    mockProgramTemplate.id,
  );
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(
    mockProgramTemplate.blocks[0]?.id ?? null,
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isTestPlaying, setIsTestPlaying] = useState(false);

  const blocks = template.blocks;
  const totalDurationSec = useMemo(
    () => calculateTotalDurationSec(blocks),
    [blocks],
  );

  const selectedBlock = useMemo(
    () => blocks.find((b) => b.id === selectedBlockId) ?? null,
    [blocks, selectedBlockId],
  );

  const showMessage = useCallback((message: string) => {
    setStatusMessage(message);
    window.setTimeout(() => setStatusMessage(null), 3000);
  }, []);

  const buildTemplateSnapshot = useCallback((): WorkoutProgramTemplate => {
    const now = new Date().toISOString();
    const reindexed = reindexBlocks(blocks);
    return {
      ...template,
      blocks: reindexed,
      totalDurationSec: calculateTotalDurationSec(reindexed),
      updatedAt: now,
    };
  }, [blocks, template]);

  const applyTemplateToEditor = useCallback((loaded: WorkoutProgramTemplate) => {
    setTemplate(loaded);
    setActiveTemplateId(loaded.id);
    setSelectedBlockId(loaded.blocks[0]?.id ?? null);
  }, []);

  const loadTemplate = useCallback(
    (templateId: string) => {
      const saved = getProgramTemplateById(templateId);
      if (!saved) {
        showMessage('템플릿을 찾을 수 없습니다.');
        return false;
      }
      const blocks = cloneBlocksWithNewIds(saved.blocks);
      const loaded: WorkoutProgramTemplate = {
        ...saved,
        blocks,
        totalDurationSec: calculateTotalDurationSec(blocks),
      };
      applyTemplateToEditor(loaded);
      showMessage(`「${loaded.title}」을(를) 불러왔습니다.`);
      return true;
    },
    [applyTemplateToEditor, showMessage],
  );

  const copyTemplateById = useCallback(
    (templateId: string) => {
      const copy = duplicateProgramTemplate(templateId, cloneBlocksWithNewIds);
      if (!copy) {
        showMessage('템플릿 복사에 실패했습니다.');
        return false;
      }
      applyTemplateToEditor(copy);
      showMessage(`「${copy.title}」으로 복사해 편집 중입니다.`);
      return true;
    },
    [applyTemplateToEditor, showMessage],
  );

  const copyCurrentTemplate = useCallback(() => {
    const snapshot = buildTemplateSnapshot();
    const now = new Date().toISOString();
    const copy: WorkoutProgramTemplate = {
      ...snapshot,
      id: `template_${Date.now()}`,
      title: `${snapshot.title} (복사본)`,
      blocks: cloneBlocksWithNewIds(snapshot.blocks),
      createdAt: now,
      updatedAt: now,
    };
    copy.totalDurationSec = calculateTotalDurationSec(copy.blocks);

    if (!persistProgramTemplate(copy)) {
      showMessage('복사본 저장에 실패했습니다.');
      return false;
    }
    applyTemplateToEditor(copy);
    showMessage(`「${copy.title}」으로 복사 저장되었습니다.`);
    return true;
  }, [applyTemplateToEditor, buildTemplateSnapshot, showMessage]);

  const deleteTemplate = useCallback(
    (templateId: string) => {
      const target = getProgramTemplateById(templateId);
      if (!target) {
        showMessage('템플릿을 찾을 수 없습니다.');
        return false;
      }
      const confirmed = window.confirm(`「${target.title}」 템플릿을 삭제할까요?`);
      if (!confirmed) return false;

      if (!removeProgramTemplate(templateId)) {
        showMessage('템플릿 삭제에 실패했습니다.');
        return false;
      }
      if (activeTemplateId === templateId) {
        setActiveTemplateId(null);
      }
      showMessage('템플릿이 삭제되었습니다.');
      return true;
    },
    [activeTemplateId, showMessage],
  );

  const saveTemplate = useCallback(() => {
    const now = new Date().toISOString();
    const base = buildTemplateSnapshot();
    const templateId = activeTemplateId ?? `template_${Date.now()}`;
    const snapshot: WorkoutProgramTemplate = {
      ...base,
      id: templateId,
      createdAt: base.createdAt || now,
      updatedAt: now,
    };

    const ok = persistProgramTemplate(snapshot);
    if (!ok) {
      showMessage('템플릿 저장에 실패했습니다. 브라우저 저장 공간을 확인해 주세요.');
      return false;
    }

    setTemplate(snapshot);
    setActiveTemplateId(templateId);
    showMessage(`「${snapshot.title}」 템플릿이 저장되었습니다.`);
    return true;
  }, [activeTemplateId, buildTemplateSnapshot, showMessage]);

  const updateBlocks = useCallback((nextBlocks: ProgramBlock[]) => {
    const reindexed = reindexBlocks(nextBlocks);
    setTemplate((prev) => ({
      ...prev,
      blocks: reindexed,
      totalDurationSec: calculateTotalDurationSec(reindexed),
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  const addVideoToTimeline = useCallback(
    (video: WorkoutVideo) => {
      const newBlock = createVideoBlockFromWorkout(video, blocks.length + 1);
      const next = reindexBlocks([...blocks, newBlock]);
      setTemplate((prev) => ({
        ...prev,
        blocks: next,
        totalDurationSec: calculateTotalDurationSec(next),
        updatedAt: new Date().toISOString(),
      }));
      setSelectedBlockId(newBlock.id);
    },
    [blocks],
  );

  const addRestBlock = useCallback(() => {
    const newBlock: ProgramBlock = {
      id: `block_rest_${Date.now()}`,
      type: 'rest',
      title: '휴식',
      order: blocks.length + 1,
      durationSec: 30,
      message: '휴식 중입니다',
    };
    const next = reindexBlocks([...blocks, newBlock]);
    updateBlocks(next);
    setSelectedBlockId(newBlock.id);
  }, [blocks, updateBlocks]);

  const addCountdownBlock = useCallback(() => {
    const newBlock: ProgramBlock = {
      id: `block_countdown_${Date.now()}`,
      type: 'countdown',
      title: '카운트다운',
      order: blocks.length + 1,
      durationSec: 10,
      countFromSec: 10,
    };
    const next = reindexBlocks([...blocks, newBlock]);
    updateBlocks(next);
    setSelectedBlockId(newBlock.id);
  }, [blocks, updateBlocks]);

  const removeBlock = useCallback(
    (blockId: string) => {
      const removedIndex = blocks.findIndex((b) => b.id === blockId);
      const next = blocks.filter((b) => b.id !== blockId);
      updateBlocks(next);
      if (selectedBlockId === blockId) {
        const fallback = next[removedIndex] ?? next[removedIndex - 1] ?? null;
        setSelectedBlockId(fallback?.id ?? null);
      }
    },
    [blocks, selectedBlockId, updateBlocks],
  );

  const moveBlock = useCallback(
    (blockId: string, direction: 'up' | 'down') => {
      const index = blocks.findIndex((b) => b.id === blockId);
      if (index < 0) return;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= blocks.length) return;
      const overId = blocks[targetIndex].id;
      updateBlocks(reorderBlocks(blocks, blockId, overId));
    },
    [blocks, updateBlocks],
  );

  const handleDragReorder = useCallback(
    (activeId: string, overId: string) => {
      updateBlocks(reorderBlocks(blocks, activeId, overId));
    },
    [blocks, updateBlocks],
  );

  const updateBlock = useCallback(
    (blockId: string, updater: (block: ProgramBlock) => ProgramBlock) => {
      const next = blocks.map((b) => (b.id === blockId ? updater(b) : b));
      updateBlocks(next);
    },
    [blocks, updateBlocks],
  );

  const updateVideoBlockSettings = useCallback(
    (
      blockId: string,
      patch: Partial<
        Pick<
          VideoProgramBlock,
          | 'playMode'
          | 'repeatCount'
          | 'targetDurationSec'
          | 'restAfterSec'
          | 'voiceCues'
          | 'title'
        >
      >,
    ) => {
      updateBlock(blockId, (block) => {
        if (block.type !== 'video') return block;
        const video = getVideoById(mockWorkoutVideos, block.videoId);
        if (!video) return { ...block, ...patch };

        const playMode = patch.playMode ?? block.playMode;
        const repeatCount = patch.repeatCount ?? block.repeatCount;
        const targetDurationSec =
          patch.targetDurationSec ?? block.targetDurationSec;

        const durationSec = computeVideoBlockDuration(
          video,
          playMode,
          repeatCount,
          targetDurationSec,
        );

        return {
          ...block,
          ...patch,
          playMode,
          repeatCount,
          targetDurationSec,
          durationSec,
        };
      });
    },
    [updateBlock],
  );

  return {
    template,
    activeTemplateId,
    blocks,
    videos: mockWorkoutVideos,
    selectedBlockId,
    selectedBlock,
    totalDurationSec,
    statusMessage,
    isTestPlaying,
    setSelectedBlockId,
    addVideoToTimeline,
    addRestBlock,
    addCountdownBlock,
    removeBlock,
    moveBlock,
    handleDragReorder,
    updateBlock,
    updateVideoBlockSettings,
    saveTemplate,
    loadTemplate,
    copyTemplateById,
    copyCurrentTemplate,
    deleteTemplate,
    showMessage,
    setIsTestPlaying,
    setTemplateTitle: (title: string) =>
      setTemplate((prev) => ({ ...prev, title })),
  };
}

export type ProgramBuilderState = ReturnType<typeof useProgramBuilderState>;
