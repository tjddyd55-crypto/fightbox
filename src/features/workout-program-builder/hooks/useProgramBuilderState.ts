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
  buildWorkoutVideoMap,
  cloneBlocksWithNewIds,
  computeVideoBlockDuration,
  createCountdownBlock,
  createRestBlock,
  createVideoBlockFromWorkout,
  createVoiceBlock,
  duplicateBlockInList,
  getTimelineTotalDurationSeconds,
  getVideoById,
  reindexBlocks,
  reorderBlocks,
} from '../utils/programTimelineUtils';
import {
  validateProgramBlocks,
  type ProgramValidationResult,
} from '../utils/programValidationUtils';

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
  const videos = mockWorkoutVideos;
  const videoMap = useMemo(() => buildWorkoutVideoMap(videos), [videos]);

  const totalDurationSec = useMemo(
    () => getTimelineTotalDurationSeconds(blocks, videoMap),
    [blocks, videoMap],
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
      totalDurationSec: getTimelineTotalDurationSeconds(reindexed, videoMap),
      updatedAt: now,
    };
  }, [blocks, template, videoMap]);

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
        totalDurationSec: getTimelineTotalDurationSeconds(blocks, videoMap),
      };
      applyTemplateToEditor(loaded);
      showMessage(`「${loaded.title}」을(를) 불러왔습니다.`);
      return true;
    },
    [applyTemplateToEditor, showMessage, videoMap],
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
    copy.totalDurationSec = getTimelineTotalDurationSeconds(copy.blocks, videoMap);

    if (!persistProgramTemplate(copy)) {
      showMessage('복사본 저장에 실패했습니다.');
      return false;
    }
    applyTemplateToEditor(copy);
    showMessage(`「${copy.title}」으로 복사 저장되었습니다.`);
    return true;
  }, [applyTemplateToEditor, buildTemplateSnapshot, showMessage, videoMap]);

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

  const validateProgram = useCallback((): ProgramValidationResult => {
    return validateProgramBlocks(blocks, videos);
  }, [blocks, videos]);

  const saveTemplate = useCallback(() => {
    const validation = validateProgramBlocks(blocks, videos);
    if (!validation.isValid) {
      const issue = validation.errors[0];
      showMessage(issue?.message ?? '저장할 수 없습니다.');
      if (issue?.blockId) {
        setSelectedBlockId(issue.blockId);
      }
      return false;
    }
    if (validation.warnings.length > 0) {
      const proceed = window.confirm(
        `${validation.warnings.map((w) => w.message).join('\n')}\n\n그래도 저장할까요?`,
      );
      if (!proceed) {
        return false;
      }
    }

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
  }, [activeTemplateId, blocks, buildTemplateSnapshot, showMessage, videos]);

  const updateBlocks = useCallback(
    (nextBlocks: ProgramBlock[]) => {
      const reindexed = reindexBlocks(nextBlocks);
      setTemplate((prev) => ({
        ...prev,
        blocks: reindexed,
        totalDurationSec: getTimelineTotalDurationSeconds(reindexed, videoMap),
        updatedAt: new Date().toISOString(),
      }));
    },
    [videoMap],
  );

  const appendBlock = useCallback(
    (newBlock: ProgramBlock) => {
      const next = reindexBlocks([...blocks, newBlock]);
      updateBlocks(next);
      setSelectedBlockId(newBlock.id);
    },
    [blocks, updateBlocks],
  );

  const addVideoToTimeline = useCallback(
    (video: WorkoutVideo) => {
      appendBlock(createVideoBlockFromWorkout(video, blocks.length + 1));
    },
    [appendBlock, blocks.length],
  );

  const addVideoBlock = useCallback(
    (videoId: string) => {
      const video = getVideoById(videos, videoId);
      if (!video) {
        showMessage('영상을 찾을 수 없습니다.');
        return;
      }
      addVideoToTimeline(video);
    },
    [addVideoToTimeline, showMessage, videos],
  );

  const addRestBlock = useCallback(
    (durationSeconds = 30) => {
      appendBlock(createRestBlock(blocks.length + 1, durationSeconds));
    },
    [appendBlock, blocks.length],
  );

  const addCountdownBlock = useCallback(
    (durationSeconds = 10) => {
      appendBlock(createCountdownBlock(blocks.length + 1, durationSeconds));
    },
    [appendBlock, blocks.length],
  );

  const addVoiceBlock = useCallback(
    (message = '준비하세요') => {
      appendBlock(createVoiceBlock(blocks.length + 1, message));
    },
    [appendBlock, blocks.length],
  );

  const duplicateBlock = useCallback(
    (blockId: string) => {
      const result = duplicateBlockInList(blocks, blockId);
      if (!result) return;
      updateBlocks(result.blocks);
      setSelectedBlockId(result.newBlockId);
    },
    [blocks, updateBlocks],
  );

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
        const video = getVideoById(videos, block.videoId);
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
    [updateBlock, videos],
  );

  return {
    template,
    activeTemplateId,
    blocks,
    videos,
    videoMap,
    selectedBlockId,
    selectedBlock,
    totalDurationSec,
    statusMessage,
    isTestPlaying,
    setSelectedBlockId,
    addVideoToTimeline,
    addVideoBlock,
    addRestBlock,
    addCountdownBlock,
    addVoiceBlock,
    duplicateBlock,
    removeBlock,
    moveBlock,
    handleDragReorder,
    updateBlock,
    updateVideoBlockSettings,
    validateProgram,
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
