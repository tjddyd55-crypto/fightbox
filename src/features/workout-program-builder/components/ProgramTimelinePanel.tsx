import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { ProgramBlock } from '../types/workoutProgramBuilder.types';
import type { ProgramBuilderState } from '../hooks/useProgramBuilderState';
import { TimelineBlockRow } from './TimelineBlockRow';

interface ProgramTimelinePanelProps {
  blocks: ProgramBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string) => void;
  onMoveBlock: ProgramBuilderState['moveBlock'];
  onRemoveBlock: ProgramBuilderState['removeBlock'];
  onDragReorder: ProgramBuilderState['handleDragReorder'];
  onAddRest: ProgramBuilderState['addRestBlock'];
  onAddCountdown: ProgramBuilderState['addCountdownBlock'];
}

export function ProgramTimelinePanel({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onMoveBlock,
  onRemoveBlock,
  onDragReorder,
  onAddRest,
  onAddCountdown,
}: ProgramTimelinePanelProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onDragReorder(String(active.id), String(over.id));
  };

  return (
    <section className="wpb-panel wpb-panel-timeline" aria-label="프로그램 타임라인">
      <header className="wpb-panel-header">
        <h2>프로그램 타임라인</h2>
        <p>순서를 드래그하거나 클릭해 선택하세요</p>
      </header>
      <section className="wpb-panel-scroll">
        <section className="wpb-timeline-toolbar">
          <button type="button" className="wpb-btn wpb-btn-ghost" onClick={onAddRest}>
            + 휴식
          </button>
          <button type="button" className="wpb-btn wpb-btn-ghost" onClick={onAddCountdown}>
            + 카운트다운
          </button>
        </section>
        {blocks.length === 0 ? (
          <p className="wpb-empty">좌측 라이브러리에서 영상을 추가하세요.</p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              {blocks.map((block) => (
                <TimelineBlockRow
                  key={block.id}
                  block={block}
                  isSelected={block.id === selectedBlockId}
                  onSelect={onSelectBlock}
                  onMoveUp={onMoveBlock}
                  onMoveDown={onMoveBlock}
                  onRemove={onRemoveBlock}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </section>
    </section>
  );
}
