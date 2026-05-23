export const CREDITS_CHANGED_EVENT = 'fightbox:credits-changed';

export function dispatchCreditsChanged(): void {
  window.dispatchEvent(new CustomEvent(CREDITS_CHANGED_EVENT));
}
