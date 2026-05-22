import type { ProgramBlock, WorkoutVideo } from '../types/workoutProgramBuilder.types';
import type { ProgramBuilderState } from '../hooks/useProgramBuilderState';
import { BlockPreviewCard } from './BlockPreviewCard';
import { BlockSettingsForm } from './BlockSettingsForm';

interface SelectedBlockPanelProps {
  selectedBlock: ProgramBlock | null;
  videos: WorkoutVideo[];
  onUpdateBlock: ProgramBuilderState['updateBlock'];
  onUpdateVideoSettings: ProgramBuilderState['updateVideoBlockSettings'];
  canEditTemplates?: boolean;
}

export function SelectedBlockPanel({
  selectedBlock,
  videos,
  onUpdateBlock,
  onUpdateVideoSettings,
  canEditTemplates = true,
}: SelectedBlockPanelProps) {
  return (
    <section
      id="wpb-mobile-panel-settings"
      className="wpb-panel wpb-panel-right"
      role="tabpanel"
      aria-labelledby="wpb-mobile-tab-settings"
      aria-label="선택 블록 미리보기 및 설정"
    >
      <header className="wpb-panel-header">
        <h2>선택된 블록</h2>
        <p className="wpb-sync-hint">
          {selectedBlock
            ? selectedBlock.title
            : '타임라인에서 블록을 선택하세요'}
        </p>
      </header>
      <section
        className={`wpb-panel-scroll wpb-panel-scroll--right${canEditTemplates ? '' : ' wpb-panel-readonly'}`}
      >
        <BlockPreviewCard block={selectedBlock} videos={videos} />
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
