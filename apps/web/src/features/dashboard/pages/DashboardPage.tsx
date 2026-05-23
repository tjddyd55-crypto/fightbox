import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FightboxUserRole } from '@fightbox/shared';
import { useAuth } from '../../auth/AuthContext';
import { AuthAuditLogModal } from '../../workout-program-builder/components/AuthAuditLogModal';
import { StaffPermissionModal } from '../../workout-program-builder/components/StaffPermissionModal';
import { UserManagementModal } from '../../workout-program-builder/components/UserManagementModal';
import { getBuilderHeaderScopeLabel } from '../../workout-program-builder/services/fightboxContextConfig';
import { getFightboxClientPermissionsForUser } from '../../workout-program-builder/services/fightboxPermissions';
import { DashboardLayout } from '../components/DashboardLayout';
import { SuperAdminDashboard } from '../components/SuperAdminDashboard';
import { GymAdminDashboard } from '../components/GymAdminDashboard';
import { GymStaffDashboard } from '../components/GymStaffDashboard';
import { CreatorDashboard } from '../components/CreatorDashboard';
import type { DashboardActions, DashboardNavItem } from '../dashboard.types';
import { buildBuilderUrl, getDashboardTitle } from '../dashboard.utils';
import '../dashboard.css';

function buildSidebarItems(
  role: FightboxUserRole,
  permissions: ReturnType<typeof getFightboxClientPermissionsForUser>,
  actions: DashboardActions,
): DashboardNavItem[] {
  const items: DashboardNavItem[] = [
    { id: 'dashboard', label: '대시보드', icon: '🏠', href: '/dashboard', active: true },
  ];

  const canAccessBuilder =
    role === 'super_admin' ||
    role === 'gym_admin' ||
    role === 'video_creator' ||
    permissions.canUploadVideos ||
    permissions.canCreateTemplates ||
    permissions.canEditTemplates;

  if (canAccessBuilder) {
    items.push({
      id: 'builder',
      label: '프로그램 빌더',
      icon: '🛠',
      onClick: () => actions.goToBuilder(),
    });
  }

  if (permissions.canManageUsers && actions.openUserManagement) {
    items.push({
      id: 'users',
      label: '사용자 관리',
      icon: '👥',
      onClick: actions.openUserManagement,
    });
  }

  if (permissions.canManageStaffPermissions && actions.openStaffPermissions) {
    items.push({
      id: 'staff',
      label: '직원 권한',
      icon: '🔐',
      onClick: actions.openStaffPermissions,
    });
  }

  if (permissions.canViewAuthAuditLogs && actions.openAuthAuditLogs) {
    items.push({
      id: 'audit',
      label: '감사 로그',
      icon: '📋',
      onClick: actions.openAuthAuditLogs,
    });
  }

  if (permissions.canViewBilling && actions.goToBilling) {
    items.push({
      id: 'billing',
      label: permissions.canManageBilling ? '결제/크레딧' : '크레딧 충전',
      icon: '💳',
      onClick: actions.goToBilling,
    });
  }

  return items;
}

export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isStaffPermissionOpen, setIsStaffPermissionOpen] = useState(false);
  const [isAuthAuditLogOpen, setIsAuthAuditLogOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const permissions = useMemo(
    () => (user ? getFightboxClientPermissionsForUser(user) : null),
    [user],
  );

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  const handleNotify = useCallback((message: string) => {
    setStatusMessage(message);
    window.setTimeout(() => setStatusMessage(null), 4000);
  }, []);

  const actions: DashboardActions = useMemo(
    () => ({
      goToBuilder: (params) => navigate(buildBuilderUrl(params)),
      goToBilling: permissions?.canViewBilling
        ? () => navigate('/dashboard/billing')
        : undefined,
      openUserManagement: permissions?.canManageUsers
        ? () => setIsUserManagementOpen(true)
        : undefined,
      openStaffPermissions: permissions?.canManageStaffPermissions
        ? () => setIsStaffPermissionOpen(true)
        : undefined,
      openAuthAuditLogs: permissions?.canViewAuthAuditLogs
        ? () => setIsAuthAuditLogOpen(true)
        : undefined,
    }),
    [navigate, permissions],
  );

  if (!user || !permissions) {
    return null;
  }

  const scopeLabel = getBuilderHeaderScopeLabel(user);
  const title = getDashboardTitle(user.role);
  const sidebarItems = buildSidebarItems(user.role, permissions, actions);

  const viewProps = { user, permissions, scopeLabel, actions };

  let content;
  switch (user.role) {
    case 'super_admin':
      content = <SuperAdminDashboard {...viewProps} />;
      break;
    case 'gym_admin':
      content = <GymAdminDashboard {...viewProps} />;
      break;
    case 'gym_staff':
      content = <GymStaffDashboard {...viewProps} />;
      break;
    case 'video_creator':
      content = <CreatorDashboard {...viewProps} />;
      break;
    default:
      content = (
        <div className="dash-unknown">
          <p>접근 권한을 확인할 수 없습니다.</p>
          <button type="button" onClick={handleLogout}>
            로그아웃
          </button>
        </div>
      );
  }

  return (
    <>
      <DashboardLayout
        user={user}
        scopeLabel={scopeLabel}
        title={title}
        sidebarItems={sidebarItems}
        onLogout={handleLogout}
        showCreditBalance={permissions.canViewBilling}
      >
        {content}
      </DashboardLayout>

      {permissions.canManageUsers ? (
        <UserManagementModal
          isOpen={isUserManagementOpen}
          managerUser={user}
          onClose={() => setIsUserManagementOpen(false)}
          onNotify={handleNotify}
        />
      ) : null}

      {permissions.canManageStaffPermissions ? (
        <StaffPermissionModal
          isOpen={isStaffPermissionOpen}
          managerUser={user}
          onClose={() => setIsStaffPermissionOpen(false)}
          onNotify={handleNotify}
        />
      ) : null}

      {permissions.canViewAuthAuditLogs ? (
        <AuthAuditLogModal
          isOpen={isAuthAuditLogOpen}
          managerUser={user}
          onClose={() => setIsAuthAuditLogOpen(false)}
        />
      ) : null}

      {statusMessage ? (
        <p className="dash-status-toast" role="status">
          {statusMessage}
        </p>
      ) : null}
    </>
  );
}
