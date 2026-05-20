import { useEffect, useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ProgramBlock, WorkoutVideo } from '../types/workoutProgramBuilder.types';
import { formatDuration } from '../utils/durationUtils';
import { buildWorkoutVideoMap, getBlockDurationSeconds } from '../utils/programTimelineUtils';
import {
  BLOCK_TYPE_LABEL,
  getBlockSubtitle,
  getBlockTypeIcon,
} from '../utils/blockDisplayUtils';
import type { ProgramBuilderState } from '../hooks/useProgramBuilderState';

interface TimelineBlockRowProps {
  block: ProgramBlock;
  videos: WorkoutVideo[];
  blockIndex: number;
  blockCount: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onMoveUp: ProgramBuilderState['moveBlock'];
  onMoveDown: ProgramBuilderState['moveBlock'];
  onRemove: ProgramBuilderState['removeBlock'];
  onDuplicate: ProgramBuilderState['duplicateBlock'];
}

export function TimelineBlockRow({
  block,
  videos,
  blockIndex,
  blockCount,
  isSelected,
  onSelect,
  onMoveUp,
  onMoveDown,
  onRemove,
  onDuplicate,
}: TimelineBlockRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuWrapRef = useRef<HTMLDivElement>(null);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id });

  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (menuWrapRef.current?.contains(event.target as Node)) return;
      setMenuOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [menuOpen]);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
    zIndex: isDragging ? 2 : undefined,
  };

  const videoMap = buildWorkoutVideoMap(videos);
  const displayDurationSec = getBlockDurationSeconds(block, videoMap);
  const canMoveUp = blockIndex > 0;
  const canMoveDown = blockIndex < blockCount - 1;

  const loopVideo =
    block.type === 'video' &&
    (block.playMode === 'loop_until_duration' || block.playMode === 'repeat_count');

  const handleRemove = () => {
    const confirmed = window.confirm(`「${block.title}」 블록을 삭제할까요?`);
    if (!confirmed) return;
    onRemove(block.id);
  };

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
        <span className="wpb-timeline-duration">{formatDuration(displayDurationSec)}</span>
      </button>

      <div className="wpb-mobile-order-inline" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="wpb-icon-btn wpb-mobile-order-btn"
          disabled={!canMoveUp}
          aria-label={`${block.title} 위로 이동`}
          onClick={() => onMoveUp(block.id, 'up')}
        >
          ↑
        </button>
        <button
          type="button"
          className="wpb-icon-btn wpb-mobile-order-btn"
          disabled={!canMoveDown}
          aria-label={`${block.title} 아래로 이동`}
          onClick={() => onMoveDown(block.id, 'down')}
        >
          ↓
        </button>
      </div>

      <div ref={menuWrapRef} className="wpb-timeline-menu-wrap">
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
              <button
                type="button"
                role="menuitem"
                disabled={!canMoveUp}
                onClick={() => {
                  onMoveUp(block.id, 'up');
                  setMenuOpen(false);
                }}
              >
                위로 이동
              </button>
            </li>
            <li role="none">
              <button
                type="button"
                role="menuitem"
                disabled={!canMoveDown}
                onClick={() => {
                  onMoveDown(block.id, 'down');
                  setMenuOpen(false);
                }}
              >
                아래로 이동
              </button>
            </li>
            <li role="none">
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  onDuplicate(block.id);
                  setMenuOpen(false);
                }}
              >
                복제
              </button>
            </li>
            <li role="none">
              <button
                type="button"
                role="menuitem"
                className="danger"
                onClick={() => {
                  handleRemove();
                  setMenuOpen(false);
                }}
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
