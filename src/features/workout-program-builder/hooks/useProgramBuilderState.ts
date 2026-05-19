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
  calculateTotalDurationSec,
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
    showMessage,
    setIsTestPlaying,
    setTemplateTitle: (title: string) =>
      setTemplate((prev) => ({ ...prev, title })),
  };
}

export type ProgramBuilderState = ReturnType<typeof useProgramBuilderState>;
