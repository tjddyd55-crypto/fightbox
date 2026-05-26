import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ProgramBlock, WorkoutProgramTemplate, WorkoutVideo } from '../types/workoutProgramBuilder.types';
import { programFromWorkoutTemplate } from '../../program-player/utils/programPlayerDataAdapter';
import { getProgramBlockDurationSec } from '../../program-player/utils/programPlayerTimeUtils';
import type { ProgramPlayerBlock } from '../../program-player/types/programPlayer.types';
import {
  buildWorkoutVideoMap,
  getBlockTimelineContributionSeconds,
  getTimelineTotalDurationSeconds,
} from '../utils/programTimelineUtils';

/** Wall-clock seconds advanced per 100ms tick while fast mode is on. */
export const FAST_SIM_SECONDS_PER_TICK = 2;
export const PLAYBACK_TICK_MS = 100;

interface UseTestPlaybackOptions {
  blocks: ProgramBlock[];
  videos: WorkoutVideo[];
  initialBlockId: string | null;
  templateTitle?: string;
}

export function useTestPlayback({
  blocks,
  videos,
  initialBlockId,
  templateTitle = '테스트 재생',
}: UseTestPlaybackOptions) {
  const videoMap = useMemo(() => buildWorkoutVideoMap(videos), [videos]);

  const playerBlocks = useMemo((): ProgramPlayerBlock[] => {
    const template: WorkoutProgramTemplate = {
      id: 'test_playback',
      title: templateTitle,
      tags: [],
      totalDurationSec: 0,
      blocks,
      visibility: 'private',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return programFromWorkoutTemplate(template, videos).blocks;
  }, [blocks, videos, templateTitle]);

  const initialIndex = useMemo(() => {
    if (!initialBlockId) return 0;
    const idx = playerBlocks.findIndex((b) => b.id === initialBlockId);
    return idx >= 0 ? idx : 0;
  }, [playerBlocks, initialBlockId]);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [fastMode, setFastMode] = useState(true);
  const [elapsedInBlock, setElapsedInBlock] = useState(0);
  const [videoRepeatIndex, setVideoRepeatIndex] = useState(1);
  const [isComplete, setIsComplete] = useState(false);
  const isAdvancingRef = useRef(false);
  const videoLoopGuardRef = useRef<{ blockId: string; repeatIndex: number } | null>(null);

  const totalDuration = useMemo(
    () => getTimelineTotalDurationSeconds(blocks, videoMap),
    [blocks, videoMap],
  );

  const currentBlock = playerBlocks[currentIndex] ?? null;
  const sourceBlock = blocks.find((b) => b.id === currentBlock?.id) ?? null;

  const currentBlockDuration = currentBlock
    ? getProgramBlockDurationSec(currentBlock)
    : 0;

  const currentBlockPlayDuration = sourceBlock
    ? getBlockTimelineContributionSeconds(sourceBlock, videoMap) -
      (sourceBlock.type === 'video' ? Math.max(0, sourceBlock.restAfterSec ?? 0) : 0)
    : currentBlockDuration;

  const totalElapsed = useMemo(() => {
    const before = playerBlocks
      .slice(0, currentIndex)
      .reduce((sum, block) => sum + getProgramBlockDurationSec(block), 0);
    return before + Math.min(elapsedInBlock, currentBlockDuration);
  }, [playerBlocks, currentIndex, elapsedInBlock, currentBlockDuration]);

  const remainingInBlock = Math.max(0, currentBlockDuration - elapsedInBlock);
  const nextBlock = playerBlocks[currentIndex + 1] ?? null;

  const progressPercent =
    totalDuration > 0 ? Math.min(100, Math.round((totalElapsed / totalDuration) * 100)) : 0;

  const countdownDisplay =
    currentBlock?.type === 'countdown'
      ? Math.max(1, Math.ceil(remainingInBlock))
      : null;

  const videoRepeatTarget =
    currentBlock?.type === 'video' ? Math.max(1, currentBlock.repeatCount ?? 1) : 1;

  const resetToStart = useCallback(() => {
    setCurrentIndex(0);
    setElapsedInBlock(0);
    setVideoRepeatIndex(1);
    setIsComplete(false);
    setIsPlaying(true);
  }, []);

  const goToIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, playerBlocks.length - 1));
      setCurrentIndex(clamped);
      setElapsedInBlock(0);
      setVideoRepeatIndex(1);
      setIsComplete(false);
    },
    [playerBlocks.length],
  );

  const goNext = useCallback(() => {
    if (currentIndex < playerBlocks.length - 1) {
      goToIndex(currentIndex + 1);
      return;
    }
    setIsPlaying(false);
    setIsComplete(true);
  }, [playerBlocks.length, currentIndex, goToIndex]);

  const goPrev = useCallback(() => {
    goToIndex(currentIndex - 1);
  }, [currentIndex, goToIndex]);

  const onVideoLoopComplete = useCallback(() => {
    if (!currentBlock || currentBlock.type !== 'video') return;
    if (currentBlock.playbackMode !== 'repeat_count') return;
    const guard = { blockId: currentBlock.id, repeatIndex: videoRepeatIndex };
    if (
      videoLoopGuardRef.current?.blockId === guard.blockId &&
      videoLoopGuardRef.current?.repeatIndex === guard.repeatIndex
    ) {
      return;
    }
    videoLoopGuardRef.current = guard;

    const target = Math.max(1, currentBlock.repeatCount ?? 1);
    if (videoRepeatIndex < target) {
      setVideoRepeatIndex((prev) => prev + 1);
      setElapsedInBlock(0);
      return;
    }
    if (!isAdvancingRef.current) {
      isAdvancingRef.current = true;
      goNext();
      isAdvancingRef.current = false;
    }
  }, [currentBlock, videoRepeatIndex, goNext]);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setElapsedInBlock(0);
    setVideoRepeatIndex(1);
    setIsComplete(false);
    setIsPlaying(true);
  }, [initialIndex, playerBlocks]);

  useEffect(() => {
    setElapsedInBlock(0);
    setVideoRepeatIndex(1);
    isAdvancingRef.current = false;
    videoLoopGuardRef.current = null;
  }, [currentIndex]);

  useEffect(() => {
    if (!isPlaying || !currentBlock || playerBlocks.length === 0 || isComplete) {
      return;
    }

    const tickSec = fastMode ? FAST_SIM_SECONDS_PER_TICK : PLAYBACK_TICK_MS / 1000;

    const timer = window.setInterval(() => {
      setElapsedInBlock((prev) => prev + tickSec);
    }, PLAYBACK_TICK_MS);

    return () => window.clearInterval(timer);
  }, [isPlaying, currentBlock, playerBlocks.length, isComplete, fastMode]);

  useEffect(() => {
    if (!isPlaying || isComplete || currentBlockDuration <= 0 || !currentBlock) {
      return;
    }

    const loopSec = currentBlock.singleLoopDurationSec ?? currentBlockDuration;

    if (
      currentBlock.type === 'video' &&
      currentBlock.playbackMode === 'repeat_count' &&
      elapsedInBlock >= loopSec
    ) {
      if (!isAdvancingRef.current) {
        isAdvancingRef.current = true;
        onVideoLoopComplete();
        isAdvancingRef.current = false;
      }
      return;
    }

    if (elapsedInBlock >= currentBlockDuration && !isAdvancingRef.current) {
      isAdvancingRef.current = true;
      goNext();
    }
  }, [
    elapsedInBlock,
    currentBlockDuration,
    currentBlock,
    isPlaying,
    isComplete,
    goNext,
    onVideoLoopComplete,
  ]);

  return {
    videoMap,
    playerBlocks,
    sourceBlock,
    currentIndex,
    currentBlock,
    nextBlock,
    isPlaying,
    isComplete,
    fastMode,
    elapsedInBlock,
    currentBlockDuration,
    currentBlockPlayDuration,
    remainingInBlock,
    totalElapsed,
    totalDuration,
    progressPercent,
    countdownDisplay,
    videoRepeatIndex,
    videoRepeatTarget,
    setIsPlaying,
    setFastMode,
    goNext,
    goPrev,
    resetToStart,
    goToIndex,
    onVideoLoopComplete,
  };
}
