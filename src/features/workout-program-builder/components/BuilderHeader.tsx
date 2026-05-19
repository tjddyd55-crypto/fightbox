import type { WorkoutProgramTemplate } from '../types/workoutProgramBuilder.types';
import { formatDuration } from '../utils/durationUtils';

interface BuilderHeaderProps {
  template: WorkoutProgramTemplate;
  totalDurationSec: number;
}

export function BuilderHeader({ template, totalDurationSec }: BuilderHeaderProps) {
  return (
    <header className="wpb-header">
      <h1>체육관 운동 프로그램 빌더</h1>
      <div className="wpb-header-meta">
        <span className="wpb-save-badge">● 자동 저장됨</span>
        <span>{template.title}</span>
        <span>총 {formatDuration(totalDurationSec)}</span>
        <span>관리자 · 코치</span>
      </div>
    </header>
  );
}
