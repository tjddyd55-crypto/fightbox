import { mockCreditWallet } from '../data/mockCreditWallet';
import type { WorkoutProgramTemplate } from '../types/workoutProgramBuilder.types';
import { formatDuration } from '../utils/durationUtils';

interface BuilderHeaderProps {
  template: WorkoutProgramTemplate;
  totalDurationSec: number;
  roleLabel: string;
}

export function BuilderHeader({ template, totalDurationSec, roleLabel }: BuilderHeaderProps) {
  return (
    <header className="wpb-header">
      <div className="wpb-header-start">
        <button type="button" className="wpb-header-menu-btn" aria-label="메뉴 열기" />
        <h1>체육관 운동 프로그램 빌더</h1>
      </div>
      <div className="wpb-header-meta">
        <span className="wpb-save-badge">● 자동 저장됨</span>
        <span className="wpb-header-meta-template">{template.title}</span>
        <span className="wpb-header-meta-duration">총 {formatDuration(totalDurationSec)}</span>
        <span className="wpb-header-meta-credits" title="보유 크레딧 (더미)">
          {mockCreditWallet.balance} {mockCreditWallet.currencyLabel}
        </span>
        <span className="wpb-header-meta-role">{roleLabel}</span>
      </div>
    </header>
  );
}
