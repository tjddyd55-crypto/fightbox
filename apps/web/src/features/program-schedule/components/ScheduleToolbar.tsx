interface ScheduleToolbarProps {
  title: string;
  entryCount: number;
  canManage: boolean;
  onRefresh: () => void;
  loading: boolean;
}

export function ScheduleToolbar({
  title,
  entryCount,
  canManage,
  onRefresh,
  loading,
}: ScheduleToolbarProps) {
  return (
    <header className="schedule-toolbar">
      <div>
        <h1>{title}</h1>
        <p className="schedule-toolbar-sub">
          일요일~토요일 · 30분 단위 · 매주 반복 기본 시간표 ({entryCount}개 수업)
        </p>
      </div>
      <div className="schedule-toolbar-actions">
        {!canManage ? (
          <span className="schedule-toolbar-badge">조회 전용</span>
        ) : (
          <span className="schedule-toolbar-badge schedule-toolbar-badge--edit">편집 가능</span>
        )}
        <button type="button" className="schedule-btn" onClick={onRefresh} disabled={loading}>
          {loading ? '새로고침 중…' : '새로고침'}
        </button>
      </div>
    </header>
  );
}
