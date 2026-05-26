/**
 * Program builder editing state.
 *
 * Owns: active template (blocks + metadata), selectedBlockId, toasts, test-play modal flag.
 * Does not own: layout/viewport, filter UI state (VideoLibraryPanel local), persistence (STEP 2+ storage).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createInitialEditorTemplate,
  getInitialActiveTemplateId,
  getInitialSelectedBlockId,
} from '../utils/editorTemplateUtils';
import type {
  CreateWorkoutVideoInput,
  CreateYouTubeWorkoutVideoInput,
  ProgramBlock,
  PublicShareSubmissionPayload,
  UpdateWorkoutVideoInput,
  VideoProgramBlock,
  WorkoutProgramTemplate,
  WorkoutVideo,
} from '../types/workoutProgramBuilder.types';
import {
  duplicateTemplate,
  getTemplate,
  removeTemplate,
  saveTemplate as persistTemplate,
  submitTemplateForPublic,
} from '../repositories/programTemplateRepository';
import {
  createVideo,
  createYouTubeVideo,
  deleteVideo,
  listVideos,
  persistCreatedVideoToApi,
  refreshVideosFromApi,
  updateVideoMetadata,
} from '../repositories/videoRepository';
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
import {
  setWorkoutBuilderSyncErrorHandler,
  logWorkoutBuilderStorageConfig,
} from '../services/workoutBuilderStorageConfig';
import { logFightboxClientContext } from '../services/fightboxContextConfig';

export function useProgramBuilderState() {
  const [template, setTemplate] = useState<WorkoutProgramTemplate>(() => createInitialEditorTemplate());
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(() =>
    getInitialActiveTemplateId(),
  );
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(() =>
    getInitialSelectedBlockId(createInitialEditorTemplate()),
  );
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isTestPlaying, setIsTestPlaying] = useState(false);
  const [videos, setVideos] = useState<WorkoutVideo[]>(() => listVideos());

  const blocks = template.blocks;
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

  useEffect(() => {
    logWorkoutBuilderStorageConfig();
    logFightboxClientContext();
    setWorkoutBuilderSyncErrorHandler(showMessage);
    void refreshVideosFromApi().then((nextVideos) => {
      setVideos(nextVideos);
    });
    return () => setWorkoutBuilderSyncErrorHandler(null);
  }, [showMessage]);

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
      const saved = getTemplate(templateId);
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
      const copy = duplicateTemplate(templateId);
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

    if (!persistTemplate(copy)) {
      showMessage('복사본 저장에 실패했습니다.');
      return false;
    }
    applyTemplateToEditor(copy);
    showMessage(`「${copy.title}」으로 복사 저장되었습니다.`);
    return true;
  }, [applyTemplateToEditor, buildTemplateSnapshot, showMessage, videoMap]);

  const deleteTemplate = useCallback(
    (templateId: string) => {
      const target = getTemplate(templateId);
      if (!target) {
        showMessage('템플릿을 찾을 수 없습니다.');
        return false;
      }
      const confirmed = window.confirm(`「${target.title}」 템플릿을 삭제할까요?`);
      if (!confirmed) return false;

      if (!removeTemplate(templateId)) {
        showMessage('템플릿 삭제에 실패했습니다.');
        return false;
      }
      if (activeTemplateId === templateId) {
        setActiveTemplateId(null);
        const resetTemplate = createInitialEditorTemplate();
        setTemplate(resetTemplate);
        setSelectedBlockId(null);
      }
      showMessage('템플릿이 삭제되었습니다.');
      return true;
    },
    [activeTemplateId, showMessage],
  );

  const validateProgram = useCallback((): ProgramValidationResult => {
    return validateProgramBlocks(blocks, videos);
  }, [blocks, videos]);

  const submitPublicShare = useCallback(
    async (payload: PublicShareSubmissionPayload) => {
      if (template.visibility === 'public_pending') {
        showMessage('이미 공용 라이브러리 승인 대기 중입니다.');
        return false;
      }

      const snapshot = buildTemplateSnapshot();
      if (!persistTemplate(snapshot)) {
        showMessage('공용 신청 전 템플릿 저장에 실패했습니다.');
        return false;
      }

      setTemplate(snapshot);
      setActiveTemplateId(snapshot.id);

      const updated = await submitTemplateForPublic(snapshot.id, payload);
      if (!updated) {
        showMessage('공용 신청에 실패했습니다.');
        return false;
      }
      setTemplate(updated);
      showMessage(`「${updated.title}」이(가) 공용 라이브러리 승인 대기 상태입니다.`);
      return true;
    },
    [buildTemplateSnapshot, showMessage, template.visibility],
  );

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

    const ok = persistTemplate(snapshot);
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

  const registerVideo = useCallback(
    (input: CreateWorkoutVideoInput): WorkoutVideo | null => {
      const created = createVideo(input);
      if (!created) {
        showMessage('영상 등록에 실패했습니다. 브라우저 저장 공간을 확인해 주세요.');
        return null;
      }
      setVideos(listVideos());
      void persistCreatedVideoToApi(created).then(() => {
        setVideos(listVideos());
      });
      showMessage(`「${created.title}」 영상이 등록되었습니다.`);
      return created;
    },
    [showMessage],
  );

  const registerYouTubeVideo = useCallback(
    (input: CreateYouTubeWorkoutVideoInput): WorkoutVideo | null => {
      const created = createYouTubeVideo(input);
      if (!created) {
        showMessage('유튜브 영상 등록에 실패했습니다. 브라우저 저장 공간을 확인해 주세요.');
        return null;
      }
      setVideos(listVideos());
      void persistCreatedVideoToApi(created).then(() => {
        setVideos(listVideos());
      });
      showMessage(`「${created.title}」 유튜브 영상이 등록되었습니다.`);
      return created;
    },
    [showMessage],
  );

  const isVideoUsedInTimeline = useCallback(
    (videoId: string) =>
      blocks.some((block) => block.type === 'video' && block.videoId === videoId),
    [blocks],
  );

  const syncTimelineBlocksForVideo = useCallback(
    (updated: WorkoutVideo) => {
      setTemplate((prev) => {
        const nextBlocks = prev.blocks.map((block) => {
          if (block.type !== 'video' || block.videoId !== updated.id) return block;
          const durationSec = computeVideoBlockDuration(
            updated,
            block.playMode,
            block.repeatCount,
            block.targetDurationSec,
          );
          return { ...block, title: updated.title, durationSec };
        });
        const videoMap = buildWorkoutVideoMap(
          videos.map((video) => (video.id === updated.id ? updated : video)),
        );
        return {
          ...prev,
          blocks: nextBlocks,
          totalDurationSec: getTimelineTotalDurationSeconds(nextBlocks, videoMap),
        };
      });
    },
    [videos],
  );

  const updateRegisteredVideo = useCallback(
    (videoId: string, input: UpdateWorkoutVideoInput): boolean => {
      const updated = updateVideoMetadata(videoId, input);
      if (!updated) {
        showMessage('영상 수정에 실패했습니다.');
        return false;
      }
      setVideos(listVideos());
      syncTimelineBlocksForVideo(updated);
      showMessage('영상 정보가 수정되었습니다.');
      return true;
    },
    [showMessage, syncTimelineBlocksForVideo],
  );

  const deleteRegisteredVideo = useCallback(
    (videoId: string): boolean => {
      if (isVideoUsedInTimeline(videoId)) {
        showMessage(
          '이 영상은 현재 타임라인에서 사용 중입니다. 먼저 타임라인에서 제거하세요.',
        );
        return false;
      }
      if (!deleteVideo(videoId)) {
        showMessage('영상 삭제에 실패했습니다.');
        return false;
      }
      setVideos(listVideos());
      if (selectedBlockId) {
        const selected = blocks.find((block) => block.id === selectedBlockId);
        if (selected?.type === 'video' && selected.videoId === videoId) {
          setSelectedBlockId(null);
        }
      }
      showMessage('영상이 삭제되었습니다.');
      return true;
    },
    [blocks, isVideoUsedInTimeline, selectedBlockId, showMessage],
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
    registerVideo,
    registerYouTubeVideo,
    updateRegisteredVideo,
    deleteRegisteredVideo,
    isVideoUsedInTimeline,
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
    submitPublicShare,
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
