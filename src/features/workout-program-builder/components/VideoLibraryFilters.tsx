import type { WorkoutDifficulty } from '../types/workoutProgramBuilder.types';
import {
  VIDEO_DIFFICULTY_OPTIONS,
  VIDEO_DURATION_RANGE_OPTIONS,
  type VideoDurationRange,
} from '../utils/videoFilterUtils';
import { FilterChips } from './FilterChips';

interface VideoLibraryFiltersProps {
  tags: string[];
  selectedTags: string[];
  selectedDifficulty: WorkoutDifficulty | null;
  selectedDurationRange: VideoDurationRange;
  repeatableOnly: boolean;
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
  onSelectDifficulty: (difficulty: WorkoutDifficulty | null) => void;
  onSelectDurationRange: (range: VideoDurationRange) => void;
  onRepeatableOnlyChange: (value: boolean) => void;
}

export function VideoLibraryFiltersBar({
  tags,
  selectedTags,
  selectedDifficulty,
  selectedDurationRange,
  repeatableOnly,
  onToggleTag,
  onClearTags,
  onSelectDifficulty,
  onSelectDurationRange,
  onRepeatableOnlyChange,
}: VideoLibraryFiltersProps) {
  return (
    <div className="wpb-library-filters" aria-label="영상 필터">
      <FilterChips
        tags={tags}
        selectedTags={selectedTags}
        onToggleTag={onToggleTag}
        onClearTags={onClearTags}
      />

      <div className="wpb-chips" role="group" aria-label="난이도 필터">
        {VIDEO_DIFFICULTY_OPTIONS.map(({ value, label }) => (
          <button
            key={value ?? 'all'}
            type="button"
            className={`wpb-chip${selectedDifficulty === value ? ' active' : ''}`}
            onClick={() => onSelectDifficulty(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="wpb-chips" role="group" aria-label="영상 길이 필터">
        {VIDEO_DURATION_RANGE_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            type="button"
            className={`wpb-chip${selectedDurationRange === value ? ' active' : ''}`}
            onClick={() => onSelectDurationRange(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <label className="wpb-filter-repeatable">
        <input
          type="checkbox"
          checked={repeatableOnly}
          onChange={(e) => onRepeatableOnlyChange(e.target.checked)}
        />
        <span>반복 가능만</span>
      </label>
    </div>
  );
}
