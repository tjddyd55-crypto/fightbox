import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ProgramBlock, WorkoutVideo } from '../types/workoutProgramBuilder.types';
import {
  buildWorkoutVideoMap,
  getBlockDurationSeconds,
  getBlockTimelineContributionSeconds,
  getElapsedTimelineSecondsBeforeIndex,
  getTimelineTotalDurationSeconds,
} from '../utils/programTimelineUtils';

/** Wall-clock seconds advanced per 100ms tick while fast mode is on. */
export const FAST_SIM_SECONDS_PER_TICK = 2;
export const PLAYBACK_TICK_MS = 100;

interface UseTestPlaybackOptions {
  blocks: ProgramBlock[];
  videos: WorkoutVideo[];
  initialBlockId: string | null;
}

export function useTestPlayback({ blocks, videos, initialBlockId }: UseTestPlaybackOptions) {
  const videoMap = useMemo(() => buildWorkoutVideoMap(videos), [videos]);

  const initialIndex = useMemo(() => {
    if (!initialBlockId) return 0;
    const idx = blocks.findIndex((b) => b.id === initialBlockId);
    return idx >= 0 ? idx : 0;
  }, [blocks, initialBlockId]);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [fastMode, setFastMode] = useState(true);
  const [elapsedInBlock, setElapsedInBlock] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const isAdvancingRef = useRef(false);

  const totalDuration = useMemo(
    () => getTimelineTotalDurationSeconds(blocks, videoMap),
    [blocks, videoMap],
  );

  const currentBlock = blocks[currentIndex] ?? null;

  const currentBlockDuration = currentBlock
    ? getBlockTimelineContributionSeconds(currentBlock, videoMap)
    : 0;

  const currentBlockPlayDuration = currentBlock
    ? getBlockDurationSeconds(currentBlock, videoMap)
    : 0;

  const totalElapsed = useMemo(() => {
    const before = getElapsedTimelineSecondsBeforeIndex(blocks, videoMap, currentIndex);
    return before + Math.min(elapsedInBlock, currentBlockDuration);
  }, [blocks, videoMap, currentIndex, elapsedInBlock, currentBlockDuration]);

  const remainingInBlock = Math.max(0, currentBlockDuration - elapsedInBlock);
  const nextBlock = blocks[currentIndex + 1] ?? null;

  const progressPercent =
    totalDuration > 0 ? Math.min(100, Math.round((totalElapsed / totalDuration) * 100)) : 0;

  const resetToStart = useCallback(() => {
    setCurrentIndex(0);
    setElapsedInBlock(0);
    setIsComplete(false);
    setIsPlaying(true);
  }, []);

  const goToIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(index, blocks.length - 1));
      setCurrentIndex(clamped);
      setElapsedInBlock(0);
      setIsComplete(false);
    },
    [blocks.length],
  );

  const goNext = useCallback(() => {
    if (currentIndex < blocks.length - 1) {
      goToIndex(currentIndex + 1);
      return;
    }
    setIsPlaying(false);
    setIsComplete(true);
  }, [blocks.length, currentIndex, goToIndex]);

  const goPrev = useCallback(() => {
    goToIndex(currentIndex - 1);
  }, [currentIndex, goToIndex]);

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setElapsedInBlock(0);
    setIsComplete(false);
    setIsPlaying(true);
  }, [initialIndex, blocks]);

  useEffect(() => {
    setElapsedInBlock(0);
    isAdvancingRef.current = false;
  }, [currentIndex]);

  useEffect(() => {
    if (!isPlaying || !currentBlock || blocks.length === 0 || isComplete) {
      return;
    }

    const tickSec = fastMode ? FAST_SIM_SECONDS_PER_TICK : PLAYBACK_TICK_MS / 1000;

    const timer = window.setInterval(() => {
      setElapsedInBlock((prev) => prev + tickSec);
    }, PLAYBACK_TICK_MS);

    return () => window.clearInterval(timer);
  }, [isPlaying, currentBlock, blocks.length, isComplete, fastMode]);

  useEffect(() => {
    if (!isPlaying || isComplete || currentBlockDuration <= 0) {
      return;
    }
    if (elapsedInBlock >= currentBlockDuration && !isAdvancingRef.current) {
      isAdvancingRef.current = true;
      goNext();
    }
  }, [elapsedInBlock, currentBlockDuration, isPlaying, isComplete, goNext]);

  const countdownDisplay =
    currentBlock?.type === 'countdown'
      ? Math.max(1, Math.ceil(currentBlock.countFromSec - elapsedInBlock))
      : null;

  return {
    videoMap,
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
    setIsPlaying,
    setFastMode,
    goNext,
    goPrev,
    resetToStart,
    goToIndex,
  };
}
