import {
  fetchProgramTemplateById,
  fetchProgramTemplates,
  fetchUploadedVideos,
  programTemplateDtoToWorkoutProgramTemplate,
  uploadedVideoDtoToWorkoutVideo,
  WorkoutBuilderApiError,
} from '../../workout-program-builder/services/workoutBuilderApiClient';
import { isApiWorkoutBuilderStorage } from '../../workout-program-builder/services/workoutBuilderStorageConfig';
import { getProgramTemplateById } from '../../workout-program-builder/storage/programTemplateStorage';
import type { ProgramPlayerProgram } from '../types/programPlayer.types';
import { programFromWorkoutTemplate } from '../utils/programPlayerDataAdapter';

export class ProgramTemplateLoadError extends Error {
  readonly code: 'NOT_FOUND' | 'EMPTY' | 'API_ERROR';

  constructor(code: 'NOT_FOUND' | 'EMPTY' | 'API_ERROR', message: string) {
    super(message);
    this.name = 'ProgramTemplateLoadError';
    this.code = code;
  }
}

export async function loadProgramFromTemplateId(
  templateId: string,
): Promise<ProgramPlayerProgram> {
  const normalizedId = templateId.trim();
  if (!normalizedId) {
    throw new ProgramTemplateLoadError('NOT_FOUND', '프로그램을 찾을 수 없습니다.');
  }

  if (isApiWorkoutBuilderStorage()) {
    try {
      const [templateDto, videoDtos] = await Promise.all([
        fetchProgramTemplateById(normalizedId),
        fetchUploadedVideos(),
      ]);

      const dto =
        templateDto ??
        (await fetchProgramTemplates()).find((template) => template.id === normalizedId) ??
        null;

      if (!dto) {
        throw new ProgramTemplateLoadError('NOT_FOUND', '프로그램을 찾을 수 없습니다.');
      }

      const template = programTemplateDtoToWorkoutProgramTemplate(dto);
      if (!template) {
        throw new ProgramTemplateLoadError('API_ERROR', '프로그램을 불러오지 못했습니다.');
      }

      const videos = videoDtos.map(uploadedVideoDtoToWorkoutVideo);
      const program = programFromWorkoutTemplate(template, videos);
      if (program.blocks.length === 0) {
        throw new ProgramTemplateLoadError('EMPTY', '실행할 블록이 없습니다.');
      }
      return program;
    } catch (error) {
      if (error instanceof ProgramTemplateLoadError) {
        throw error;
      }
      if (error instanceof WorkoutBuilderApiError) {
        throw new ProgramTemplateLoadError('API_ERROR', '프로그램을 불러오지 못했습니다.');
      }
      throw new ProgramTemplateLoadError('API_ERROR', '프로그램을 불러오지 못했습니다.');
    }
  }

  const localTemplate = getProgramTemplateById(normalizedId);
  if (!localTemplate) {
    throw new ProgramTemplateLoadError('NOT_FOUND', '프로그램을 찾을 수 없습니다.');
  }

  const program = programFromWorkoutTemplate(localTemplate, []);
  if (program.blocks.length === 0) {
    throw new ProgramTemplateLoadError('EMPTY', '실행할 블록이 없습니다.');
  }
  return program;
}
