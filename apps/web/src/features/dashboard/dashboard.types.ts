import type { FightboxClientPermissions } from '../workout-program-builder/services/fightboxPermissions';
import type { FightboxSessionUser } from '@fightbox/shared';

export interface DashboardActions {
  goToBuilder: (params?: Record<string, string>) => void;
  goToBilling?: () => void;
  openUserManagement?: () => void;
  openStaffPermissions?: () => void;
  openAuthAuditLogs?: () => void;
}

export interface DashboardViewProps {
  user: FightboxSessionUser;
  permissions: FightboxClientPermissions;
  scopeLabel: string;
  actions: DashboardActions;
}

export interface DashboardNavItem {
  id: string;
  label: string;
  icon: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
}
