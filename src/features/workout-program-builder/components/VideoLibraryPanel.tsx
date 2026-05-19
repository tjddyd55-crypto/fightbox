import { useMemo } from 'react';
import type { WorkoutVideo } from '../types/workoutProgramBuilder.types';
import { getAllTags } from '../utils/programTimelineUtils';
import type { VideoLibraryFilterState } from '../hooks/useVideoLibraryFilters';
import { VideoLibraryFiltersBar } from './VideoLibraryFilters';
import { VideoCard } from './VideoCard';

interface VideoLibraryPanelProps {
  videos: WorkoutVideo[];
  filterState: VideoLibraryFilterState;
  onAddVideo: (video: WorkoutVideo) => void;
}

export function VideoLibraryPanel({ videos, filterState, onAddVideo }: VideoLibraryPanelProps) {
  const {
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
  } = filterState;

  const tags = useMemo(() => getAllTags(videos), [videos]);

  return (
    <section
      id="wpb-mobile-panel-videos"
      className="wpb-panel wpb-panel-library"
      role="tabpanel"
      aria-labelledby="wpb-mobile-tab-videos"
      aria-label="영상 라이브러리"
    >
      <header className="wpb-panel-header">
        <h2>영상 라이브러리</h2>
        <p>검색 · 필터 후 타임라인에 추가</p>
      </header>
      <section className="wpb-panel-controls">
        <input
          type="search"
          className="wpb-search"
          placeholder="제목, 태그, 부위, 난이도 검색..."
          value={filters.searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          aria-label="영상 검색"
        />
        <VideoLibraryFiltersBar
          tags={tags}
          selectedTags={filters.selectedTags}
          selectedDifficulty={filters.selectedDifficulty}
          selectedDurationRange={filters.selectedDurationRange}
          repeatableOnly={filters.repeatableOnly}
          onToggleTag={toggleTag}
          onClearTags={clearTags}
          onSelectDifficulty={setDifficulty}
          onSelectDurationRange={setDurationRange}
          onRepeatableOnlyChange={setRepeatableOnly}
        />
      </section>
      <section className="wpb-panel-scroll" aria-label="영상 목록">
        {filteredVideos.length === 0 ? (
          <div className="wpb-empty">
            <p className="wpb-empty-title">조건에 맞는 영상이 없습니다</p>
            <p className="wpb-empty-desc">검색어나 필터를 변경하거나 초기화해 보세요.</p>
            {isFiltered && (
              <button type="button" className="wpb-btn wpb-btn-ghost wpb-btn-sm" onClick={resetFilters}>
                필터 초기화
              </button>
            )}
          </div>
        ) : (
          <div className="wpb-video-list">
            {filteredVideos.map((video) => (
              <VideoCard key={video.id} video={video} onAdd={onAddVideo} />
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
