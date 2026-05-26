import type { ProgramBlock, WorkoutVideo } from '../types/workoutProgramBuilder.types';
import type { ProgramBuilderState } from '../hooks/useProgramBuilderState';
import { CountdownBlockSettings } from './blockSettings/CountdownBlockSettings';
import { RestBlockSettings } from './blockSettings/RestBlockSettings';
import { VideoBlockSettings } from './blockSettings/VideoBlockSettings';
import { VoiceGuideBlockSettings } from './blockSettings/VoiceGuideBlockSettings';

interface BlockSettingsFormProps {
  block: ProgramBlock | null;
  videos: WorkoutVideo[];
  onUpdateBlock: ProgramBuilderState['updateBlock'];
  onUpdateVideoSettings: ProgramBuilderState['updateVideoBlockSettings'];
}

export function BlockSettingsForm({
  block,
  videos,
  onUpdateBlock,
  onUpdateVideoSettings,
}: BlockSettingsFormProps) {
  if (!block) {
    return <p className="wpb-empty wpb-empty--compact">설정할 블록을 선택하세요.</p>;
  }

  if (block.type === 'video') {
    return (
      <VideoBlockSettings
        block={block}
        videos={videos}
        onUpdateBlock={onUpdateBlock}
        onUpdateVideoSettings={onUpdateVideoSettings}
      />
    );
  }

  if (block.type === 'rest') {
    return <RestBlockSettings block={block} onUpdateBlock={onUpdateBlock} />;
  }

  if (block.type === 'countdown') {
    return <CountdownBlockSettings block={block} onUpdateBlock={onUpdateBlock} />;
  }

  return <VoiceGuideBlockSettings block={block} onUpdateBlock={onUpdateBlock} />;
}
