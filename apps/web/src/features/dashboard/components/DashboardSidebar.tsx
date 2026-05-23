import { useNavigate } from 'react-router-dom';
import type { DashboardNavItem } from '../dashboard.types';

interface DashboardSidebarProps {
  items: DashboardNavItem[];
  onLogout: () => void;
}

export function DashboardSidebar({ items, onLogout }: DashboardSidebarProps) {
  const navigate = useNavigate();

  return (
    <aside className="dash-sidebar" aria-label="대시보드 메뉴">
      <nav className="dash-sidebar-nav">
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                className={`dash-sidebar-link${item.active ? ' dash-sidebar-link--active' : ''}`}
                onClick={() => {
                  if (item.onClick) {
                    item.onClick();
                    return;
                  }
                  if (item.href) {
                    navigate(item.href);
                  }
                }}
              >
                <span className="dash-sidebar-icon" aria-hidden="true">
                  {item.icon}
                </span>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <button type="button" className="dash-sidebar-logout" onClick={onLogout}>
        로그아웃
      </button>
    </aside>
  );
}
