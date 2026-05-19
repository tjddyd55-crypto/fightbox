import type { WorkoutDifficulty, WorkoutVideo } from '../types/workoutProgramBuilder.types';

export type VideoDurationRange = 'all' | 'short' | 'medium' | 'long';

export interface VideoLibraryFilters {
  searchQuery: string;
  selectedTags: string[];
  selectedDifficulty: WorkoutDifficulty | null;
  selectedDurationRange: VideoDurationRange;
  repeatableOnly: boolean;
}

const DURATION_SHORT_MIN_SEC = 10;
const DURATION_SHORT_MAX_SEC = 60;
const DURATION_MEDIUM_MAX_SEC = 300;

const DIFFICULTY_LABEL: Record<WorkoutDifficulty, string> = {
  beginner: '초급',
  intermediate: '중급',
  advanced: '고급',
};

export const VIDEO_DURATION_RANGE_OPTIONS: {
  value: VideoDurationRange;
  label: string;
}[] = [
  { value: 'all', label: '전체' },
  { value: 'short', label: '10초~1분' },
  { value: 'medium', label: '1분~5분' },
  { value: 'long', label: '5분 이상' },
];

export const VIDEO_DIFFICULTY_OPTIONS: {
  value: WorkoutDifficulty | null;
  label: string;
}[] = [
  { value: null, label: '전체' },
  { value: 'beginner', label: DIFFICULTY_LABEL.beginner },
  { value: 'intermediate', label: DIFFICULTY_LABEL.intermediate },
  { value: 'advanced', label: DIFFICULTY_LABEL.advanced },
];

export function createDefaultVideoFilters(): VideoLibraryFilters {
  return {
    searchQuery: '',
    selectedTags: [],
    selectedDifficulty: null,
    selectedDurationRange: 'all',
    repeatableOnly: false,
  };
}

export function hasActiveVideoFilters(filters: VideoLibraryFilters): boolean {
  return (
    filters.searchQuery.trim().length > 0 ||
    filters.selectedTags.length > 0 ||
    filters.selectedDifficulty !== null ||
    filters.selectedDurationRange !== 'all' ||
    filters.repeatableOnly
  );
}

function matchesDurationRange(durationSec: number, range: VideoDurationRange): boolean {
  switch (range) {
    case 'short':
      return durationSec >= DURATION_SHORT_MIN_SEC && durationSec <= DURATION_SHORT_MAX_SEC;
    case 'medium':
      return durationSec > DURATION_SHORT_MAX_SEC && durationSec <= DURATION_MEDIUM_MAX_SEC;
    case 'long':
      return durationSec > DURATION_MEDIUM_MAX_SEC;
    case 'all':
    default:
      return true;
  }
}

function matchesSearchQuery(video: WorkoutVideo, query: string): boolean {
  if (!query) return true;

  const haystacks = [
    video.title,
    video.description ?? '',
    ...video.tags,
    ...video.bodyParts,
    DIFFICULTY_LABEL[video.difficulty],
  ];

  return haystacks.some((text) => text.toLowerCase().includes(query));
}

export function filterWorkoutVideos(
  videos: WorkoutVideo[],
  filters: VideoLibraryFilters,
): WorkoutVideo[] {
  const query = filters.searchQuery.trim().toLowerCase();

  return videos.filter((video) => {
    if (filters.repeatableOnly && !video.isLoopable) return false;
    if (filters.selectedDifficulty && video.difficulty !== filters.selectedDifficulty) {
      return false;
    }
    if (!matchesDurationRange(video.durationSec, filters.selectedDurationRange)) {
      return false;
    }
    if (
      filters.selectedTags.length > 0 &&
      !filters.selectedTags.every((tag) => video.tags.includes(tag))
    ) {
      return false;
    }
    return matchesSearchQuery(video, query);
  });
}
