interface DashboardMenuCardProps {
  icon: string;
  title: string;
  description: string;
  badge?: string;
  hint?: string;
  disabled?: boolean;
  onClick?: () => void;
}

export function DashboardMenuCard({
  icon,
  title,
  description,
  badge,
  hint,
  disabled = false,
  onClick,
}: DashboardMenuCardProps) {
  return (
    <article className={`dash-card${disabled ? ' dash-card--disabled' : ''}`}>
      <div className="dash-card-icon" aria-hidden="true">
        {icon}
      </div>
      <div className="dash-card-body">
        <div className="dash-card-head">
          <h3 className="dash-card-title">{title}</h3>
          {badge ? <span className="dash-card-badge">{badge}</span> : null}
        </div>
        <p className="dash-card-desc">{description}</p>
        {hint ? <p className="dash-card-hint">{hint}</p> : null}
      </div>
      <button
        type="button"
        className="dash-card-action"
        disabled={disabled}
        onClick={disabled ? undefined : onClick}
      >
        {disabled ? '준비 중' : '바로가기'}
      </button>
    </article>
  );
}
