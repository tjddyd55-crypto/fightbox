interface FilterChipsProps {
  tags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  onClearTags: () => void;
}

export function FilterChips({
  tags,
  selectedTags,
  onToggleTag,
  onClearTags,
}: FilterChipsProps) {
  const allActive = selectedTags.length === 0;

  return (
    <div className="wpb-chips" role="group" aria-label="태그 필터">
      <button
        type="button"
        className={`wpb-chip${allActive ? ' active' : ''}`}
        onClick={onClearTags}
      >
        전체
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          className={`wpb-chip${selectedTags.includes(tag) ? ' active' : ''}`}
          onClick={() => onToggleTag(tag)}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
