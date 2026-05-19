import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ProgramBlock } from '../types/workoutProgramBuilder.types';
import { formatDuration } from '../utils/durationUtils';
import type { ProgramBuilderState } from '../hooks/useProgramBuilderState';

const TYPE_LABEL: Record<ProgramBlock['type'], string> = {
  video: '영상',
  rest: '휴식',
  countdown: '카운트다운',
  voice: '음성',
};

function getBlockSubtitle(block: ProgramBlock): string {
  switch (block.type) {
    case 'video':
      if (block.playMode === 'repeat_count') {
        return `${formatDuration(block.durationSec)} · ${block.repeatCount ?? 1}회 반복`;
      }
      if (block.playMode === 'loop_until_duration') {
        return `${formatDuration(block.durationSec)} · 지정 시간 반복`;
      }
      return formatDuration(block.durationSec);
    case 'rest':
      return block.nextBlockTitle
        ? `다음: ${block.nextBlockTitle}`
        : block.message ?? formatDuration(block.durationSec);
    case 'countdown':
      return `${block.countFromSec}초 카운트`;
    case 'voice':
      return block.cueText;
  }
}

interface TimelineBlockRowProps {
  block: ProgramBlock;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onMoveUp: ProgramBuilderState['moveBlock'];
  onMoveDown: ProgramBuilderState['moveBlock'];
  onRemove: ProgramBuilderState['removeBlock'];
}

export function TimelineBlockRow({
  block,
  isSelected,
  onSelect,
  onMoveUp,
  onMoveDown,
  onRemove,
}: TimelineBlockRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`wpb-timeline-row${isSelected ? ' selected' : ''}`}
      onClick={() => onSelect(block.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(block.id);
        }
      }}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`${block.order}번 ${block.title}`}
    >
      <span className="wpb-drag-handle" {...attributes} {...listeners} aria-hidden>
        ⋮⋮
      </span>
      <span className="wpb-timeline-order">{block.order}</span>
      <span className="wpb-timeline-content">
        <h4>{block.title}</h4>
        <p>{getBlockSubtitle(block)}</p>
      </span>
      <span className={`wpb-type-pill ${block.type}`}>{TYPE_LABEL[block.type]}</span>
      <span className="wpb-timeline-actions" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="wpb-icon-btn"
          onClick={() => onMoveUp(block.id, 'up')}
          aria-label="위로 이동"
        >
          ↑
        </button>
        <button
          type="button"
          className="wpb-icon-btn"
          onClick={() => onMoveDown(block.id, 'down')}
          aria-label="아래로 이동"
        >
          ↓
        </button>
        <button
          type="button"
          className="wpb-icon-btn"
          onClick={() => onRemove(block.id)}
          aria-label="삭제"
        >
          ×
        </button>
      </span>
    </article>
  );
}
