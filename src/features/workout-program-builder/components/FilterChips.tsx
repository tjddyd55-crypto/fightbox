interface FilterChipsProps {
  tags: string[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

export function FilterChips({ tags, selectedTag, onSelectTag }: FilterChipsProps) {
  return (
    <div className="wpb-chips" role="group" aria-label="태그 필터">
      <button
        type="button"
        className={`wpb-chip${selectedTag === null ? ' active' : ''}`}
        onClick={() => onSelectTag(null)}
      >
        전체
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          className={`wpb-chip${selectedTag === tag ? ' active' : ''}`}
          onClick={() => onSelectTag(selectedTag === tag ? null : tag)}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
