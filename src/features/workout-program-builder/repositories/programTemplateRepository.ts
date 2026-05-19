/**
 * Program template data access layer.
 * Replace localStorage calls here with API requests when the backend is ready.
 */
import type {
  PublicShareSubmissionPayload,
  WorkoutProgramTemplate,
} from '../types/workoutProgramBuilder.types';
import { mockWorkoutVideos } from '../data/mockWorkoutVideos';
import {
  buildWorkoutVideoMap,
  cloneBlocksWithNewIds,
  getTimelineTotalDurationSeconds,
} from '../utils/programTimelineUtils';
import {
  deleteProgramTemplate,
  duplicateProgramTemplate as duplicateInStorage,
  getProgramTemplateById,
  getSavedProgramTemplates,
  saveProgramTemplate,
  updateProgramTemplate,
} from '../storage/programTemplateStorage';

export function listTemplates(): WorkoutProgramTemplate[] {
  return getSavedProgramTemplates();
}

export function getTemplate(id: string): WorkoutProgramTemplate | undefined {
  return getProgramTemplateById(id);
}

export function saveTemplate(template: WorkoutProgramTemplate): boolean {
  return saveProgramTemplate(template);
}

export function removeTemplate(id: string): boolean {
  return deleteProgramTemplate(id);
}

export function duplicateTemplate(
  id: string,
): WorkoutProgramTemplate | null {
  return duplicateInStorage(id, cloneBlocksWithNewIds);
}

export function submitTemplateForPublicReview(
  id: string,
  payload: PublicShareSubmissionPayload,
): WorkoutProgramTemplate | null {
  const existing = getProgramTemplateById(id);
  if (!existing) return null;

  const now = new Date().toISOString();
  const blocks = existing.blocks;
  const videoMap = buildWorkoutVideoMap(mockWorkoutVideos);
  const updated: WorkoutProgramTemplate = {
    ...existing,
    title: payload.title.trim() || existing.title,
    description: payload.description?.trim() || existing.description,
    tags: payload.tags.length > 0 ? payload.tags : existing.tags,
    visibility: 'public_pending',
    updatedAt: now,
    totalDurationSec: getTimelineTotalDurationSeconds(blocks, videoMap),
  };

  if (!updateProgramTemplate(updated)) return null;
  return updated;
}
