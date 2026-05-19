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
        <h2>선택된 블록 미리보기</h2>
        <p className="wpb-sync-hint">
          {selectedBlock
            ? `「${selectedBlock.title}」 설정을 편집 중`
            : '타임라인에서 블록을 선택하세요'}
        </p>
      </header>
      <section className="wpb-panel-scroll wpb-panel-scroll--split">
        <section className="wpb-preview-section" aria-label="미리보기">
          <BlockPreviewCard block={selectedBlock} videos={videos} />
        </section>
        <section className="wpb-settings-section-wrap" aria-label="블록 설정">
          <h3 className="wpb-section-title">블록 설정</h3>
          <BlockSettingsForm
            block={selectedBlock}
            videos={videos}
            onUpdateBlock={onUpdateBlock}
            onUpdateVideoSettings={onUpdateVideoSettings}
          />
        </section>
      </section>
    </section>
  );
}
