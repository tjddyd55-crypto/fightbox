import type { FightboxSessionUser } from '@fightbox/shared';
import { FIGHTBOX_ROLE_LABELS } from '@fightbox/shared';

interface DashboardHeaderProps {
  user: FightboxSessionUser;
  scopeLabel: string;
  title: string;
  onLogout: () => void;
}

export function DashboardHeader({ user, scopeLabel, title, onLogout }: DashboardHeaderProps) {
  return (
    <header className="dash-header">
      <div className="dash-header-brand">
        <span className="dash-header-logo">FIGHTBOX</span>
        <span className="dash-header-title">{title}</span>
      </div>
      <div className="dash-header-user">
        <span className="dash-header-role">{FIGHTBOX_ROLE_LABELS[user.role]}</span>
        <span className="dash-header-login">{user.loginId}</span>
        <span className="dash-header-scope">{scopeLabel}</span>
        <button type="button" className="dash-header-logout" onClick={onLogout}>
          로그아웃
        </button>
      </div>
    </header>
  );
}
