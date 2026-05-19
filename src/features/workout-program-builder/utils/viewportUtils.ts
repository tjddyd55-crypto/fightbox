/** Desktop 3-column layout (sidebar + library / timeline / settings). */
export const DESKTOP_LAYOUT_MQ = '(min-width: 1200px)';

/** Compact tab layout (mobile + tablet). */
export const COMPACT_LAYOUT_MQ = '(max-width: 1199px)';

export function isCompactLayout(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(COMPACT_LAYOUT_MQ).matches;
}
