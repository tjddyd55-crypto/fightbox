import { useCallback, useMemo, useState } from 'react';
import type { WorkoutDifficulty, WorkoutVideo } from '../types/workoutProgramBuilder.types';
import {
  createDefaultVideoFilters,
  filterWorkoutVideos,
  hasActiveVideoFilters,
  type VideoDurationRange,
  type VideoLibraryFilters,
} from '../utils/videoFilterUtils';

export function useVideoLibraryFilters(videos: WorkoutVideo[]) {
  const [filters, setFilters] = useState<VideoLibraryFilters>(createDefaultVideoFilters);

  const filteredVideos = useMemo(
    () => filterWorkoutVideos(videos, filters),
    [videos, filters],
  );

  const isFiltered = useMemo(() => hasActiveVideoFilters(filters), [filters]);

  const setSearchQuery = useCallback((searchQuery: string) => {
    setFilters((prev) => ({ ...prev, searchQuery }));
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setFilters((prev) => {
      const selected = prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter((t) => t !== tag)
        : [...prev.selectedTags, tag];
      return { ...prev, selectedTags: selected };
    });
  }, []);

  const clearTags = useCallback(() => {
    setFilters((prev) => ({ ...prev, selectedTags: [] }));
  }, []);

  const setDifficulty = useCallback((selectedDifficulty: WorkoutDifficulty | null) => {
    setFilters((prev) => ({ ...prev, selectedDifficulty }));
  }, []);

  const setDurationRange = useCallback((selectedDurationRange: VideoDurationRange) => {
    setFilters((prev) => ({ ...prev, selectedDurationRange }));
  }, []);

  const setRepeatableOnly = useCallback((repeatableOnly: boolean) => {
    setFilters((prev) => ({ ...prev, repeatableOnly }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(createDefaultVideoFilters());
  }, []);

  return {
    filters,
    filteredVideos,
    isFiltered,
    setSearchQuery,
    toggleTag,
    clearTags,
    setDifficulty,
    setDurationRange,
    setRepeatableOnly,
    resetFilters,
  };
}

export type VideoLibraryFilterState = ReturnType<typeof useVideoLibraryFilters>;
