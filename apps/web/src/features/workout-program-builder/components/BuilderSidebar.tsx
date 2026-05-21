export type BuilderSidebarSection = 'builder' | 'templates' | 'videos' | 'settings';

export type BuilderSidebarActiveSection = 'builder' | 'videos' | 'settings';

interface BuilderSidebarProps {
  activeSection: BuilderSidebarActiveSection;
  onNavigate: (section: BuilderSidebarSection) => void;
}

const NAV_ITEMS: { id: BuilderSidebarSection; label: string }[] = [
  { id: 'builder', label: '프로그램 빌더' },
  { id: 'templates', label: '템플릿 목록' },
  { id: 'videos', label: '영상 라이브러리' },
  { id: 'settings', label: '설정' },
];

function isActiveSection(
  itemId: BuilderSidebarSection,
  activeSection: BuilderSidebarActiveSection,
): boolean {
  return itemId !== 'templates' && itemId === activeSection;
}

export function BuilderSidebar({ activeSection, onNavigate }: BuilderSidebarProps) {
  return (
    <aside className="wpb-sidebar" aria-label="관리자 네비게이션">
      <nav aria-label="프로그램 빌더 메뉴">
        {NAV_ITEMS.map((item) => {
          const active = isActiveSection(item.id, activeSection);
          return (
            <button
              key={item.id}
              type="button"
              className={`wpb-nav-item wpb-sidebar-link${active ? ' active' : ''}`}
              aria-current={active ? 'page' : undefined}
              aria-label={item.label}
              onClick={() => onNavigate(item.id)}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
