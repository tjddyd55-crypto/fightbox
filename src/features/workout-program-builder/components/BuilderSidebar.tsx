export function BuilderSidebar() {
  const items = [
    { label: '프로그램 빌더', active: true },
    { label: '템플릿 목록', active: false },
    { label: '영상 라이브러리', active: false },
    { label: '설정', active: false },
  ];

  return (
    <aside className="wpb-sidebar" aria-label="관리자 네비게이션">
      {items.map((item) => (
        <button
          key={item.label}
          type="button"
          className={`wpb-nav-item${item.active ? ' active' : ''}`}
          aria-current={item.active ? 'page' : undefined}
        >
          {item.label}
        </button>
      ))}
    </aside>
  );
}
