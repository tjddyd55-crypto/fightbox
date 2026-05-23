import type { ProgramScheduleEntryDto } from '@fightbox/shared';
import {
  DAY_LABELS,
  generateTimeSlots,
  getEntryHeightPx,
  getEntryTopPx,
  ROW_HEIGHT_PX,
  SCHEDULE_GRID_MIN_WIDTH_PX,
} from '../programSchedule.utils';
import { ScheduleEntryCard } from './ScheduleEntryCard';

interface WeeklyScheduleGridProps {
  entries: ProgramScheduleEntryDto[];
  canManage: boolean;
  onSlotClick: (dayOfWeek: number, startTime: string) => void;
  onEntryClick: (entry: ProgramScheduleEntryDto) => void;
}

export function WeeklyScheduleGrid({
  entries,
  canManage,
  onSlotClick,
  onEntryClick,
}: WeeklyScheduleGridProps) {
  const timeSlots = generateTimeSlots();
  const bodyHeight = timeSlots.length * ROW_HEIGHT_PX;

  const entriesByDay = DAY_LABELS.map((_, dayIndex) =>
    entries.filter((entry) => entry.dayOfWeek === dayIndex && entry.status !== 'hidden'),
  );

  return (
    <div className="schedule-grid-wrap">
      <div className="schedule-grid" style={{ minWidth: `${SCHEDULE_GRID_MIN_WIDTH_PX}px` }}>
        <div className="schedule-grid-header schedule-grid-corner">시간</div>
        {DAY_LABELS.map((label) => (
          <div key={label} className="schedule-grid-header schedule-grid-day-header">
            {label}
          </div>
        ))}

        <div className="schedule-time-column" style={{ height: `${bodyHeight}px` }}>
          {timeSlots.map((slot) => (
            <div key={slot} className="schedule-time-label" style={{ height: `${ROW_HEIGHT_PX}px` }}>
              {slot}
            </div>
          ))}
        </div>

        {DAY_LABELS.map((label, dayIndex) => (
          <div key={`col-${label}`} className="schedule-day-column" style={{ height: `${bodyHeight}px` }}>
            {timeSlots.map((slot) => (
              <button
                key={`${dayIndex}-${slot}`}
                type="button"
                className="schedule-slot"
                style={{ height: `${ROW_HEIGHT_PX}px` }}
                disabled={!canManage}
                onClick={() => onSlotClick(dayIndex, slot)}
                aria-label={`${label}요일 ${slot} 슬롯`}
              />
            ))}

            {entriesByDay[dayIndex]?.map((entry) => (
              <ScheduleEntryCard
                key={entry.id}
                entry={entry}
                top={getEntryTopPx(entry.startTime)}
                height={getEntryHeightPx(entry.durationMin)}
                onClick={onEntryClick}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
