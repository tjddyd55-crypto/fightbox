import type { ProgramBlock, WorkoutVideo } from '../types/workoutProgramBuilder.types';
import type { ProgramBuilderState } from '../hooks/useProgramBuilderState';
import { BlockPreviewCard } from './BlockPreviewCard';
import { BlockSettingsForm } from './BlockSettingsForm';

interface SelectedBlockPanelProps {
  selectedBlock: ProgramBlock | null;
  videos: WorkoutVideo[];
  onUpdateBlock: ProgramBuilderState['updateBlock'];
  onUpdateVideoSettings: ProgramBuilderState['updateVideoBlockSettings'];
}

export function SelectedBlockPanel({
  selectedBlock,
  videos,
  onUpdateBlock,
  onUpdateVideoSettings,
}: SelectedBlockPanelProps) {
  return (
    <section className="wpb-panel wpb-panel-right" aria-label="선택 블록 미리보기 및 설정">
      <header className="wpb-panel-header">
        <h2>선택 블록 미리보기</h2>
        <p>타임라인 클릭 시 즉시 반영됩니다</p>
      </header>
      <section className="wpb-panel-scroll">
        <BlockPreviewCard block={selectedBlock} videos={videos} />
        <h3 style={{ fontSize: 14, margin: '0 0 12px' }}>블록 설정</h3>
        <BlockSettingsForm
          block={selectedBlock}
          videos={videos}
          onUpdateBlock={onUpdateBlock}
          onUpdateVideoSettings={onUpdateVideoSettings}
        />
      </section>
    </section>
  );
}
