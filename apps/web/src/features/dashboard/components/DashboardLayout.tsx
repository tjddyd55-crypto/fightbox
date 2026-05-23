import type { ReactNode } from 'react';
import type { FightboxSessionUser } from '@fightbox/shared';
import type { DashboardNavItem } from '../dashboard.types';
import { DashboardHeader } from './DashboardHeader';
import { DashboardSidebar } from './DashboardSidebar';

interface DashboardLayoutProps {
  user: FightboxSessionUser;
  scopeLabel: string;
  title: string;
  sidebarItems: DashboardNavItem[];
  onLogout: () => void;
  showCreditBalance?: boolean;
  children: ReactNode;
}

export function DashboardLayout({
  user,
  scopeLabel,
  title,
  sidebarItems,
  onLogout,
  showCreditBalance = false,
  children,
}: DashboardLayoutProps) {
  return (
    <div className="dash-root">
      <DashboardHeader
        user={user}
        scopeLabel={scopeLabel}
        title={title}
        onLogout={onLogout}
        showCreditBalance={showCreditBalance}
      />
      <div className="dash-body">
        <DashboardSidebar items={sidebarItems} onLogout={onLogout} />
        <main className="dash-main">{children}</main>
      </div>
    </div>
  );
}
