import type { ReactNode } from 'react';
import type { FightboxSessionUser } from '@fightbox/shared';
import { FIGHTBOX_ROLE_LABELS } from '@fightbox/shared';
import { getRoleGreeting } from '../dashboard.utils';

interface DashboardHomeProps {
  user: FightboxSessionUser;
  scopeLabel: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function DashboardHome({
  user,
  scopeLabel,
  title,
  subtitle,
  children,
}: DashboardHomeProps) {
  const greeting = getRoleGreeting(user.role);

  return (
    <div className="dash-home">
      <header className="dash-home-header">
        <p className="dash-home-eyebrow">{title}</p>
        <h1 className="dash-home-greeting">안녕하세요, {greeting}님</h1>
        {subtitle ? <p className="dash-home-subtitle">{subtitle}</p> : null}
        <dl className="dash-home-meta">
          <div>
            <dt>역할</dt>
            <dd>{FIGHTBOX_ROLE_LABELS[user.role]}</dd>
          </div>
          <div>
            <dt>계정</dt>
            <dd>{user.loginId}</dd>
          </div>
          <div>
            <dt>범위</dt>
            <dd>{scopeLabel}</dd>
          </div>
          {user.gymId ? (
            <div>
              <dt>gymId</dt>
              <dd>{user.gymId}</dd>
            </div>
          ) : null}
        </dl>
      </header>
      <section className="dash-home-section" aria-labelledby="dash-today-heading">
        <h2 id="dash-today-heading" className="dash-home-section-title">
          오늘 할 수 있는 작업
        </h2>
        <div className="dash-card-grid">{children}</div>
      </section>
    </div>
  );
}
