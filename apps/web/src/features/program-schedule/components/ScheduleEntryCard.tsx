import type { MouseEvent } from 'react';
import type { ProgramScheduleEntryDto } from '@fightbox/shared';
import { useNavigate } from 'react-router-dom';
import { resolveEntryColor } from '../programSchedule.utils';

interface ScheduleEntryCardProps {
  entry: ProgramScheduleEntryDto;
  top: number;
  height: number;
  onClick: (entry: ProgramScheduleEntryDto) => void;
}

export function ScheduleEntryCard({ entry, top, height, onClick }: ScheduleEntryCardProps) {
  const navigate = useNavigate();
  const color = resolveEntryColor(entry.color, entry.templateId);
  const isCancelled = entry.status === 'cancelled';

  const handlePlay = (event: MouseEvent) => {
    event.stopPropagation();
    navigate(`/programs/${encodeURIComponent(entry.templateId)}/play`);
  };

  const handlePlayDisplay = (event: MouseEvent) => {
    event.stopPropagation();
    window.open(
      `/programs/${encodeURIComponent(entry.templateId)}/play?view=display`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  return (
    <article
      className={`schedule-entry-card${isCancelled ? ' schedule-entry-card--cancelled' : ''}`}
      style={{
        top: `${top}px`,
        height: `${Math.max(height - 4, 40)}px`,
        borderLeftColor: color,
        backgroundColor: `${color}22`,
      }}
      onClick={() => onClick(entry)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick(entry);
        }
      }}
    >
      <h3 className="schedule-entry-title">{entry.title}</h3>
      <p className="schedule-entry-time">
        {entry.startTime} – {entry.endTime}
      </p>
      {entry.coachName ? <p className="schedule-entry-meta">코치 {entry.coachName}</p> : null}
      {entry.roomName ? <p className="schedule-entry-meta">룸 {entry.roomName}</p> : null}
      <div className="schedule-entry-actions">
        <button type="button" className="schedule-entry-btn" onClick={handlePlay}>
          실행
        </button>
        <button type="button" className="schedule-entry-btn schedule-entry-btn--ghost" onClick={handlePlayDisplay}>
          새 창
        </button>
      </div>
    </article>
  );
}
