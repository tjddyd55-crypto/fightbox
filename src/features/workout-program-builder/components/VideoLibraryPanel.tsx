import { useMemo, useState } from 'react';
import type { WorkoutVideo } from '../types/workoutProgramBuilder.types';
import { getAllTags } from '../utils/programTimelineUtils';
import { FilterChips } from './FilterChips';
import { VideoCard } from './VideoCard';

interface VideoLibraryPanelProps {
  videos: WorkoutVideo[];
  onAddVideo: (video: WorkoutVideo) => void;
}

export function VideoLibraryPanel({ videos, onAddVideo }: VideoLibraryPanelProps) {
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const tags = useMemo(() => getAllTags(videos), [videos]);

  const filteredVideos = useMemo(() => {
    const query = search.trim().toLowerCase();
    return videos.filter((video) => {
      const matchesTag = !selectedTag || video.tags.includes(selectedTag);
      if (!matchesTag) return false;
      if (!query) return true;
      const inTitle = video.title.toLowerCase().includes(query);
      const inTags = video.tags.some((t) => t.toLowerCase().includes(query));
      return inTitle || inTags;
    });
  }, [videos, search, selectedTag]);

  return (
    <section className="wpb-panel wpb-panel-library" aria-label="영상 라이브러리">
      <header className="wpb-panel-header">
        <h2>영상 라이브러리</h2>
        <p>검색 · 필터 후 타임라인에 추가</p>
      </header>
      <section className="wpb-panel-controls">
        <input
          type="search"
          className="wpb-search"
          placeholder="제목 또는 태그 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="영상 검색"
        />
        <FilterChips tags={tags} selectedTag={selectedTag} onSelectTag={setSelectedTag} />
      </section>
      <section className="wpb-panel-scroll" aria-label="영상 목록">
        {filteredVideos.length === 0 ? (
          <div className="wpb-empty">
            <p className="wpb-empty-title">조건에 맞는 영상이 없습니다</p>
            <p className="wpb-empty-desc">검색어나 태그 필터를 변경해 보세요.</p>
          </div>
        ) : (
          filteredVideos.map((video) => (
            <VideoCard key={video.id} video={video} onAdd={onAddVideo} />
          ))
        )}
      </section>
    </section>
  );
}
