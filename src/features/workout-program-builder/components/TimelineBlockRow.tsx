import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ProgramBlock } from '../types/workoutProgramBuilder.types';
import { formatDuration } from '../utils/durationUtils';
import {
  BLOCK_TYPE_LABEL,
  getBlockSubtitle,
  getBlockTypeIcon,
} from '../utils/blockDisplayUtils';
import type { ProgramBuilderState } from '../hooks/useProgramBuilderState';

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
  const [menuOpen, setMenuOpen] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
    zIndex: isDragging ? 2 : undefined,
  };

  const loopVideo =
    block.type === 'video' &&
    (block.playMode === 'loop_until_duration' || block.playMode === 'repeat_count');

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`wpb-timeline-row wpb-timeline-row--${block.type}${loopVideo ? ' wpb-timeline-row--loop' : ''}${isSelected ? ' selected' : ''}${isDragging ? ' dragging' : ''}`}
    >
      <button
        type="button"
        className="wpb-drag-handle"
        {...attributes}
        {...listeners}
        aria-label={`${block.order}번 블록 순서 변경`}
        onClick={(e) => e.stopPropagation()}
      >
        ⠿
      </button>

      <button
        type="button"
        className="wpb-timeline-row-main"
        onClick={() => onSelect(block.id)}
        aria-pressed={isSelected}
        aria-label={`${block.order}번 ${block.title} 선택`}
      >
        <span className={`wpb-timeline-icon wpb-timeline-icon--${block.type}`} aria-hidden>
          {getBlockTypeIcon(block)}
        </span>
        <span className="wpb-timeline-order">{block.order}</span>
        <span className="wpb-timeline-content">
          <span className="wpb-timeline-title-row">
            <h4>{block.title}</h4>
            <span className={`wpb-type-pill ${block.type}`}>{BLOCK_TYPE_LABEL[block.type]}</span>
          </span>
          <p>{getBlockSubtitle(block)}</p>
        </span>
        <span className="wpb-timeline-duration">{formatDuration(block.durationSec)}</span>
      </button>

      <div className="wpb-timeline-menu-wrap">
        <button
          type="button"
          className="wpb-icon-btn wpb-menu-trigger"
          aria-label={`${block.title} 더보기`}
          aria-expanded={menuOpen}
          aria-haspopup="menu"
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((o) => !o);
          }}
        >
          ⋯
        </button>
        {menuOpen && (
          <ul className="wpb-timeline-menu" role="menu" onClick={(e) => e.stopPropagation()}>
            <li role="none">
              <button type="button" role="menuitem" onClick={() => { onMoveUp(block.id, 'up'); setMenuOpen(false); }}>
                위로 이동
              </button>
            </li>
            <li role="none">
              <button type="button" role="menuitem" onClick={() => { onMoveDown(block.id, 'down'); setMenuOpen(false); }}>
                아래로 이동
              </button>
            </li>
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className="danger"
                onClick={() => { onRemove(block.id); setMenuOpen(false); }}
              >
                삭제
              </button>
            </li>
          </ul>
        )}
      </div>
    </article>
  );
}
