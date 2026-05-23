export const SCHEDULE_START_HOUR = 6;
export const SCHEDULE_END_HOUR = 23;
export const SLOT_MINUTES = 30;
export const ROW_HEIGHT_PX = 48;
export const SCHEDULE_GRID_MIN_WIDTH_PX = 1100;

export const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;

export const DURATION_OPTIONS = [30, 60, 90, 120] as const;

const DEFAULT_COLORS = ['#ffd60a', '#7dffb3', '#6eb5ff', '#ff9f6e', '#c792ff', '#ff8a8a'];

export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  let minutes = SCHEDULE_START_HOUR * 60;
  const endMinutes = SCHEDULE_END_HOUR * 60;

  while (minutes <= endMinutes) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    minutes += SLOT_MINUTES;
  }

  return slots;
}

export function parseTimeToMinutes(time: string): number {
  const [hourRaw, minuteRaw] = time.split(':');
  return Number.parseInt(hourRaw ?? '0', 10) * 60 + Number.parseInt(minuteRaw ?? '0', 10);
}

export function getSlotIndex(startTime: string): number {
  const slots = generateTimeSlots();
  const index = slots.indexOf(startTime);
  return index >= 0 ? index : 0;
}

export function getEntryTopPx(startTime: string): number {
  return getSlotIndex(startTime) * ROW_HEIGHT_PX;
}

export function getEntryHeightPx(durationMin: number): number {
  return (durationMin / SLOT_MINUTES) * ROW_HEIGHT_PX;
}

export function defaultDurationFromTemplate(totalDurationSec: number): number {
  const minutes = Math.ceil(totalDurationSec / 60);
  const rounded = Math.ceil(minutes / SLOT_MINUTES) * SLOT_MINUTES;
  const clamped = Math.max(SLOT_MINUTES, rounded);
  if (DURATION_OPTIONS.includes(clamped as (typeof DURATION_OPTIONS)[number])) {
    return clamped;
  }
  const nearest = DURATION_OPTIONS.find((option) => option >= clamped);
  return nearest ?? DURATION_OPTIONS[DURATION_OPTIONS.length - 1];
}

export function defaultColorForTemplate(templateId: string): string {
  let hash = 0;
  for (const char of templateId) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }
  return DEFAULT_COLORS[Math.abs(hash) % DEFAULT_COLORS.length] ?? DEFAULT_COLORS[0];
}

export function resolveEntryColor(color: string | null, templateId: string): string {
  return color?.trim() || defaultColorForTemplate(templateId);
}
