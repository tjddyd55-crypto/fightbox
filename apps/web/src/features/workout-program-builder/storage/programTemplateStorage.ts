import { PROGRAM_TEMPLATES_STORAGE_KEY } from '../constants/builderConstants';
import type { WorkoutProgramTemplate } from '../types/workoutProgramBuilder.types';
import { mockWorkoutVideos } from '../data/mockWorkoutVideos';
import {
  buildWorkoutVideoMap,
  getTimelineTotalDurationSeconds,
} from '../utils/programTimelineUtils';

function readRaw(): WorkoutProgramTemplate[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(PROGRAM_TEMPLATES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isWorkoutProgramTemplate);
  } catch {
    return [];
  }
}

function writeAll(templates: WorkoutProgramTemplate[]): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(PROGRAM_TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
    return true;
  } catch {
    return false;
  }
}

function isWorkoutProgramTemplate(value: unknown): value is WorkoutProgramTemplate {
  if (!value || typeof value !== 'object') return false;
  const t = value as WorkoutProgramTemplate;
  return (
    typeof t.id === 'string' &&
    typeof t.title === 'string' &&
    Array.isArray(t.blocks) &&
    typeof t.totalDurationSec === 'number' &&
    typeof t.updatedAt === 'string'
  );
}

export function getSavedProgramTemplates(): WorkoutProgramTemplate[] {
  return readRaw();
}

export function getProgramTemplateById(templateId: string): WorkoutProgramTemplate | undefined {
  return readRaw().find((t) => t.id === templateId);
}

export function saveProgramTemplate(template: WorkoutProgramTemplate): boolean {
  const list = readRaw();
  const index = list.findIndex((t) => t.id === template.id);
  const next =
    index >= 0
      ? [...list.slice(0, index), template, ...list.slice(index + 1)]
      : [...list, template];
  return writeAll(next);
}

export function updateProgramTemplate(template: WorkoutProgramTemplate): boolean {
  return saveProgramTemplate(template);
}

export function deleteProgramTemplate(templateId: string): boolean {
  const next = readRaw().filter((t) => t.id !== templateId);
  return writeAll(next);
}

export function replaceProgramTemplates(templates: WorkoutProgramTemplate[]): boolean {
  return writeAll(templates);
}

export function duplicateProgramTemplate(
  templateId: string,
  cloneBlocks: (blocks: WorkoutProgramTemplate['blocks']) => WorkoutProgramTemplate['blocks'],
): WorkoutProgramTemplate | null {
  const source = getProgramTemplateById(templateId);
  if (!source) return null;

  const now = new Date().toISOString();
  const copy: WorkoutProgramTemplate = {
    ...source,
    id: `template_${Date.now()}`,
    title: `${source.title} (복사본)`,
    blocks: cloneBlocks(source.blocks),
    totalDurationSec: getTimelineTotalDurationSeconds(
      cloneBlocks(source.blocks),
      buildWorkoutVideoMap(mockWorkoutVideos),
    ),
    createdAt: now,
    updatedAt: now,
  };

  if (!saveProgramTemplate(copy)) return null;
  return copy;
}
