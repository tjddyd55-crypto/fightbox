/**
 * Program template data access layer.
 * localStorage is the fallback cache; API sync is enabled when VITE_WORKOUT_BUILDER_STORAGE=api.
 */
import type {
  PublicShareSubmissionPayload,
  WorkoutProgramTemplate,
} from '../types/workoutProgramBuilder.types';
import { mockWorkoutVideos } from '../data/mockWorkoutVideos';
import {
  deleteProgramTemplateApi,
  fetchProgramTemplates,
  programTemplateDtoToWorkoutProgramTemplate,
  upsertProgramTemplateApi,
  WorkoutBuilderApiError,
} from '../services/workoutBuilderApiClient';
import {
  isApiWorkoutBuilderStorage,
  reportWorkoutBuilderSyncError,
} from '../services/workoutBuilderStorageConfig';
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
  replaceProgramTemplates,
  saveProgramTemplate,
  updateProgramTemplate,
} from '../storage/programTemplateStorage';

function reportSyncError(action: string, error: unknown): void {
  if (error instanceof WorkoutBuilderApiError) {
    reportWorkoutBuilderSyncError(`${action}: ${error.message}`);
    return;
  }
  if (error instanceof Error) {
    reportWorkoutBuilderSyncError(`${action}: ${error.message}`);
    return;
  }
  reportWorkoutBuilderSyncError(`${action}: 알 수 없는 오류`);
}

function applySyncedTemplateToLocalCache(
  dto: Awaited<ReturnType<typeof upsertProgramTemplateApi>>,
): WorkoutProgramTemplate | null {
  const synced = programTemplateDtoToWorkoutProgramTemplate(dto);
  if (!synced) {
    return null;
  }
  saveProgramTemplate(synced);
  return synced;
}

async function persistTemplateToApi(template: WorkoutProgramTemplate): Promise<void> {
  if (!isApiWorkoutBuilderStorage()) {
    return;
  }

  try {
    const dto = await upsertProgramTemplateApi(template);
    applySyncedTemplateToLocalCache(dto);
  } catch (error) {
    reportSyncError('템플릿은 로컬에 저장됐지만 DB 저장에 실패했습니다', error);
  }
}

function syncTemplateToApi(template: WorkoutProgramTemplate): void {
  void persistTemplateToApi(template);
}

function syncDeleteTemplateToApi(id: string): void {
  if (!isApiWorkoutBuilderStorage()) {
    return;
  }

  void deleteProgramTemplateApi(id).catch((error) => {
    reportSyncError('템플릿 API 삭제', error);
  });
}

function mergeApiTemplatesWithLocalCache(
  apiTemplates: WorkoutProgramTemplate[],
): WorkoutProgramTemplate[] {
  const apiIds = new Set(apiTemplates.map((template) => template.id));
  const localPending = getSavedProgramTemplates().filter((template) => !apiIds.has(template.id));
  return [...apiTemplates, ...localPending];
}

export function listTemplates(): WorkoutProgramTemplate[] {
  return getSavedProgramTemplates();
}

export async function refreshTemplatesFromApi(): Promise<WorkoutProgramTemplate[]> {
  if (!isApiWorkoutBuilderStorage()) {
    return listTemplates();
  }

  try {
    const dtos = await fetchProgramTemplates();
    const templates = dtos
      .map(programTemplateDtoToWorkoutProgramTemplate)
      .filter((template): template is WorkoutProgramTemplate => template !== null);
    replaceProgramTemplates(mergeApiTemplatesWithLocalCache(templates));
  } catch (error) {
    reportSyncError('템플릿 목록 불러오기', error);
  }

  return listTemplates();
}

export function getTemplate(id: string): WorkoutProgramTemplate | undefined {
  return getProgramTemplateById(id);
}

export function saveTemplate(template: WorkoutProgramTemplate): boolean {
  const ok = saveProgramTemplate(template);
  if (ok) {
    syncTemplateToApi(template);
  }
  return ok;
}

export function removeTemplate(id: string): boolean {
  const ok = deleteProgramTemplate(id);
  if (ok) {
    syncDeleteTemplateToApi(id);
  }
  return ok;
}

export function duplicateTemplate(
  id: string,
): WorkoutProgramTemplate | null {
  const copy = duplicateInStorage(id, cloneBlocksWithNewIds);
  if (copy) {
    syncTemplateToApi(copy);
  }
  return copy;
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
  syncTemplateToApi(updated);
  return updated;
}
