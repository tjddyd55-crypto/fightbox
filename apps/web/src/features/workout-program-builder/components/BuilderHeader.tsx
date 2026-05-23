import { FIGHTBOX_ROLE_LABELS } from '@fightbox/shared';
import { mockCreditWallet } from '../data/mockCreditWallet';
import { shouldUseWorkoutBuilderMockCatalog } from '../services/workoutBuilderFeatureFlags';
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
  onOpenUserManagement?: () => void;
  showUserManagementButton?: boolean;
  onOpenGymManagement?: () => void;
  showGymManagementButton?: boolean;
  onOpenAuthAuditLogs?: () => void;
  showAuthAuditLogsButton?: boolean;
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
  onOpenUserManagement,
  showUserManagementButton = false,
  onOpenGymManagement,
  showGymManagementButton = false,
  onOpenAuthAuditLogs,
  showAuthAuditLogsButton = false,
}: BuilderHeaderProps) {
  const roleLabel = FIGHTBOX_ROLE_LABELS[userRole];
  const desktopRoleMeta = `${roleLabel} · ${userLoginId} · ${scopeLabel}`;
  const mobileRoleMeta = `${userLoginId} · ${scopeLabel}`;

  return (
    <header className="wpb-header">
      <div className="wpb-header-inner">
        <div className="wpb-header-row wpb-header-row--primary">
          <div className="wpb-header-start">
            <button type="button" className="wpb-header-menu-btn" aria-label="메뉴 열기" />
            <h1>체육관 운동 프로그램 빌더</h1>
          </div>
          <div className="wpb-header-primary-meta">
            <span className="wpb-save-badge">● 자동 저장됨</span>
          </div>
          <button
            type="button"
            className="wpb-header-logout-btn wpb-header-logout-btn--mobile"
            onClick={onLogout}
          >
            로그아웃
          </button>
        </div>

        <div className="wpb-header-row wpb-header-row--secondary wpb-header-mobile-meta">
          <span className="wpb-header-meta-duration wpb-header-meta-duration--mobile">
            총 {formatDuration(totalDurationSec)}
          </span>
          <span
            className="wpb-header-meta-role wpb-header-meta-role--compact"
            title={desktopRoleMeta}
          >
            {mobileRoleMeta}
          </span>
        </div>

        <div className="wpb-header-meta wpb-header-desktop-meta">
          <span className="wpb-save-badge">● 자동 저장됨</span>
          <span className="wpb-header-meta-template">{template.title}</span>
          <span className="wpb-header-meta-duration">총 {formatDuration(totalDurationSec)}</span>
          {shouldUseWorkoutBuilderMockCatalog() && (
            <span className="wpb-header-meta-credits" title="보유 크레딧 (더미)">
              {mockCreditWallet.balance} {mockCreditWallet.currencyLabel}
            </span>
          )}
          <span className="wpb-header-meta-role" title={`${userDisplayName} (${userLoginId})`}>
            {desktopRoleMeta}
          </span>
          <div className="wpb-header-desktop-actions">
            {showGymManagementButton && onOpenGymManagement ? (
              <button
                type="button"
                className="wpb-header-staff-perm-btn"
                onClick={onOpenGymManagement}
              >
                체육관 관리
              </button>
            ) : null}
            {showAuthAuditLogsButton && onOpenAuthAuditLogs ? (
              <button
                type="button"
                className="wpb-header-staff-perm-btn"
                onClick={onOpenAuthAuditLogs}
              >
                감사 로그
              </button>
            ) : null}
            {showUserManagementButton && onOpenUserManagement ? (
              <button
                type="button"
                className="wpb-header-staff-perm-btn"
                onClick={onOpenUserManagement}
              >
                사용자 관리
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
          </div>
          <button type="button" className="wpb-header-logout-btn" onClick={onLogout}>
            로그아웃
          </button>
        </div>
      </div>
    </header>
  );
}
