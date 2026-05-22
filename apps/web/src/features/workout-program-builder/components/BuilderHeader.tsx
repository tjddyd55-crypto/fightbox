import { FIGHTBOX_ROLE_LABELS } from '@fightbox/shared';
import { mockCreditWallet } from '../data/mockCreditWallet';
import type { WorkoutProgramTemplate } from '../types/workoutProgramBuilder.types';
import { formatDuration } from '../utils/durationUtils';

interface BuilderHeaderProps {
  template: WorkoutProgramTemplate;
  totalDurationSec: number;
  userDisplayName: string;
  userLoginId: string;
  userRole: keyof typeof FIGHTBOX_ROLE_LABELS;
  scopeLabel: string;
  onLogout: () => void;
  onOpenStaffPermissions?: () => void;
  showStaffPermissionsButton?: boolean;
  onOpenGymManagement?: () => void;
  showGymManagementButton?: boolean;
}

export function BuilderHeader({
  template,
  totalDurationSec,
  userDisplayName,
  userLoginId,
  userRole,
  scopeLabel,
  onLogout,
  onOpenStaffPermissions,
  showStaffPermissionsButton = false,
  onOpenGymManagement,
  showGymManagementButton = false,
}: BuilderHeaderProps) {
  const roleLabel = FIGHTBOX_ROLE_LABELS[userRole];

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
        <span className="wpb-header-meta-role" title={userLoginId}>
          {roleLabel} · {userLoginId} · {scopeLabel}
        </span>
        {showGymManagementButton && onOpenGymManagement ? (
          <button
            type="button"
            className="wpb-header-staff-perm-btn"
            onClick={onOpenGymManagement}
          >
            체육관 관리
          </button>
        ) : null}
        {showStaffPermissionsButton && onOpenStaffPermissions ? (
          <button
            type="button"
            className="wpb-header-staff-perm-btn"
            onClick={onOpenStaffPermissions}
          >
            직원 권한
          </button>
        ) : null}
        <button type="button" className="wpb-header-logout-btn" onClick={onLogout}>
          로그아웃
        </button>
      </div>
    </header>
  );
}
