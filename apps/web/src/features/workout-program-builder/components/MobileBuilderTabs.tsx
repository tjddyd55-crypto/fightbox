export type MobileBuilderTab = 'videos' | 'timeline' | 'settings';

const TABS: { id: MobileBuilderTab; label: string }[] = [
  { id: 'videos', label: '영상' },
  { id: 'timeline', label: '타임라인' },
  { id: 'settings', label: '설정' },
];

interface MobileBuilderTabsProps {
  activeTab: MobileBuilderTab;
  onTabChange: (tab: MobileBuilderTab) => void;
}

export function MobileBuilderTabs({ activeTab, onTabChange }: MobileBuilderTabsProps) {
  return (
    <nav className="wpb-mobile-tabs" aria-label="빌더 화면 전환">
      <div className="wpb-mobile-tabs-inner" role="tablist">
        {TABS.map(({ id, label }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`wpb-mobile-tab-${id}`}
              aria-selected={isActive}
              aria-controls={`wpb-mobile-panel-${id}`}
              className={`wpb-mobile-tab${isActive ? ' wpb-mobile-tab--active' : ''}`}
              onClick={() => onTabChange(id)}
            >
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
