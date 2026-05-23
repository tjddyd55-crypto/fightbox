import type { ProgramPlayerViewMode } from '../types/programPlayer.types';

export function parseProgramPlayerView(value: string | null): ProgramPlayerViewMode {
  if (value === 'display' || value === 'coach' || value === 'queue' || value === 'single') {
    return value;
  }
  return 'single';
}

export function parseShareProgramPlayerView(value: string | null): ProgramPlayerViewMode {
  if (value === 'display') {
    return 'display';
  }
  return 'single';
}

export function buildMultiScreenPath(
  basePath: string,
  view: Exclude<ProgramPlayerViewMode, 'single'>,
): string {
  const separator = basePath.includes('?') ? '&' : '?';
  return `${basePath}${separator}view=${view}`;
}
