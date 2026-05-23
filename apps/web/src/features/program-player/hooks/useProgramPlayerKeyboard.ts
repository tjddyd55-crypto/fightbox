import { useEffect, type RefObject } from 'react';
import type { ProgramPlayerState } from './useProgramPlayerState';

async function requestPlayerFullscreen(root: HTMLElement | null): Promise<void> {
  if (!root) return;
  try {
    await root.requestFullscreen();
  } catch (error) {
    console.warn('[program-player] fullscreen failed', error);
  }
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
}

export function useProgramPlayerKeyboard(
  player: ProgramPlayerState,
  rootRef?: RefObject<HTMLElement | null>,
): void {
  const { start, togglePlay, previous, next, restart, mode } = player;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      if (event.code === 'Space') {
        event.preventDefault();
        if (mode === 'start') {
          start();
        } else if (mode !== 'complete') {
          togglePlay();
        }
        return;
      }

      if (event.code === 'ArrowLeft') {
        event.preventDefault();
        if (mode !== 'start' && mode !== 'complete') {
          previous();
        }
        return;
      }

      if (event.code === 'ArrowRight') {
        event.preventDefault();
        if (mode !== 'complete') {
          next();
        }
        return;
      }

      if (event.key.toLowerCase() === 'r') {
        event.preventDefault();
        if (mode !== 'start') {
          restart();
        }
        return;
      }

      if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        void requestPlayerFullscreen(rootRef?.current ?? document.documentElement);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [start, togglePlay, previous, next, restart, mode, rootRef]);
}
