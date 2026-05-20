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
import type { ProgramBlock, WorkoutVideo } from '../types/workoutProgramBuilder.types';
import { formatDuration } from '../utils/durationUtils';
import type { ProgramBuilderState } from '../hooks/useProgramBuilderState';
import { TimelineBlockRow } from './TimelineBlockRow';

interface ProgramTimelinePanelProps {
  blocks: ProgramBlock[];
  videos: WorkoutVideo[];
  selectedBlockId: string | null;
  totalDurationSec: number;
  onSelectBlock: (id: string) => void;
  onMoveBlock: ProgramBuilderState['moveBlock'];
  onRemoveBlock: ProgramBuilderState['removeBlock'];
  onDragReorder: ProgramBuilderState['handleDragReorder'];
  onAddRest: ProgramBuilderState['addRestBlock'];
  onAddCountdown: ProgramBuilderState['addCountdownBlock'];
  onAddVoice: ProgramBuilderState['addVoiceBlock'];
  onDuplicateBlock: ProgramBuilderState['duplicateBlock'];
}

export function ProgramTimelinePanel({
  blocks,
  videos,
  selectedBlockId,
  totalDurationSec,
  onSelectBlock,
  onMoveBlock,
  onRemoveBlock,
  onDragReorder,
  onAddRest,
  onAddCountdown,
  onAddVoice,
  onDuplicateBlock,
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
    <section
      id="wpb-mobile-panel-timeline"
      className="wpb-panel wpb-panel-timeline"
      role="tabpanel"
      aria-labelledby="wpb-mobile-tab-timeline"
      aria-label="프로그램 타임라인"
    >
      <header className="wpb-panel-header">
        <h2>프로그램 타임라인</h2>
        <p>⠿ 핸들을 드래그하거나 항목을 클릭해 선택</p>
      </header>
      <section className="wpb-panel-controls wpb-timeline-toolbar-wrap">
        <section className="wpb-timeline-toolbar" aria-label="블록 추가">
          <button type="button" className="wpb-btn wpb-btn-ghost wpb-btn-sm" onClick={() => onAddRest()}>
            휴식 추가
          </button>
          <button
            type="button"
            className="wpb-btn wpb-btn-ghost wpb-btn-sm"
            onClick={() => onAddCountdown()}
          >
            카운트다운 추가
          </button>
          <button type="button" className="wpb-btn wpb-btn-ghost wpb-btn-sm" onClick={() => onAddVoice()}>
            음성 안내 추가
          </button>
        </section>
      </section>
      <section className="wpb-panel-scroll" aria-label="타임라인 블록 목록">
        {blocks.length === 0 ? (
          <div className="wpb-empty">
            <p className="wpb-empty-title">타임라인이 비어 있습니다</p>
            <p className="wpb-empty-desc">
              영상 라이브러리에서 영상을 추가하거나 휴식·카운트다운·음성 안내 블록을 추가하세요.
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
              {blocks.map((block, index) => (
                <TimelineBlockRow
                  key={block.id}
                  block={block}
                  videos={videos}
                  blockIndex={index}
                  blockCount={blocks.length}
                  isSelected={block.id === selectedBlockId}
                  onSelect={onSelectBlock}
                  onMoveUp={onMoveBlock}
                  onMoveDown={onMoveBlock}
                  onRemove={onRemoveBlock}
                  onDuplicate={onDuplicateBlock}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </section>
      <footer className="wpb-timeline-footer">
        <span>{blocks.length}개 블록</span>
        <strong>총 {formatDuration(totalDurationSec)}</strong>
      </footer>
    </section>
  );
}
