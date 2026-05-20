export const MIN_REPEAT_COUNT = 1;
export const MAX_REPEAT_COUNT = 99;
export const MIN_DURATION_SEC = 1;
export const MAX_DURATION_SEC = 3600;

export function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) {
    return min;
  }
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function parsePositiveInt(raw: string, fallback: number, min: number, max: number): number {
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    return clampInt(fallback, min, max);
  }
  return clampInt(parsed, min, max);
}
