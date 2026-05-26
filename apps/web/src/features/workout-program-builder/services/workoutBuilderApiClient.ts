import {
  WORKOUT_BUILDER_API_PATHS,
  type CreateProgramTemplateRequest,
  type CreateUploadedVideoRequest,
  type DeleteUploadedVideoResponse,
  type ProgramTemplateDto,
  type RejectPublicTemplateRequest,
  type SubmitPublicTemplateRequest,
  type UpdateProgramTemplateRequest,
  type UpdateUploadedVideoRequest,
  type UploadedVideoDto,
  type WorkoutBuilderApiItemResponse,
  type WorkoutBuilderApiListResponse,
} from '@fightbox/shared';
import type {
  TemplatePublicReviewStatus,
  WorkoutDifficulty,
  WorkoutProgramTemplate,
  WorkoutVideo,
} from '../types/workoutProgramBuilder.types';
import type { VideoStorageProvider } from '../types/videoUpload.types';
import { UPLOADED_VIDEO_PLACEHOLDER_THUMBNAIL } from '../constants/builderConstants';
import { getApiBaseUrl } from './videoUploadConfig';
import { getFightboxContextHeaders } from './fightboxContextConfig';
import {
  mapTemplateVisibilityToStatus,
  normalizeTemplateStatus,
  normalizeTemplateVisibility,
} from '../utils/templateVisibilityUtils';
import { normalizeWorkoutProgramTemplate } from '../utils/blockTypeNormalization';
import { buildWorkoutVideoMap } from '../utils/programTimelineUtils';
import { getCatalogVideos } from '../utils/videoCatalogUtils';

export class WorkoutBuilderApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'WorkoutBuilderApiError';
    this.status = status;
    this.code = code;
  }
}

interface ApiErrorBody {
  error?: {
    code?: string;
    message?: string;
  };
}

function buildUrl(path: string): string {
  const base = getApiBaseUrl();
  return base ? `${base}${path}` : path;
}

async function parseApiError(response: Response): Promise<WorkoutBuilderApiError> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    return new WorkoutBuilderApiError(
      response.status,
      body.error?.code ?? 'API_ERROR',
      body.error?.message ?? response.statusText,
    );
  } catch {
    return new WorkoutBuilderApiError(
      response.status,
      'API_ERROR',
      response.statusText || 'Request failed',
    );
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildUrl(path), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...getFightboxContextHeaders(),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw await parseApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function mapVisibilityToSourceType(visibility: string): WorkoutVideo['sourceType'] {
  return visibility === 'gym_only' ? 'gym' : 'private';
}

function mapSourceTypeToVisibility(sourceType: WorkoutVideo['sourceType']): string {
  return sourceType === 'gym' ? 'gym_only' : 'private';
}

function isWorkoutDifficulty(value: string): value is WorkoutDifficulty {
  return value === 'beginner' || value === 'intermediate' || value === 'advanced';
}

function resolveHttpThumbnailUrl(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  return null;
}

function isTemplatePublicReviewStatus(value: string): value is TemplatePublicReviewStatus {
  return value === 'pending' || value === 'approved' || value === 'rejected';
}

export function uploadedVideoDtoToWorkoutVideo(dto: UploadedVideoDto): WorkoutVideo {
  const difficulty = isWorkoutDifficulty(dto.difficulty) ? dto.difficulty : 'beginner';
  const provider = (dto.provider || 'r2') as VideoStorageProvider;
  const remoteThumbnail = resolveHttpThumbnailUrl(dto.thumbnailUrl);

  return {
    id: dto.id,
    title: dto.title,
    description: dto.description || undefined,
    durationSec: dto.durationSec,
    thumbnailUrl: remoteThumbnail ?? UPLOADED_VIDEO_PLACEHOLDER_THUMBNAIL,
    previewUrl: dto.playbackUrl || undefined,
    tags: dto.tags ?? [],
    difficulty,
    bodyParts: dto.bodyParts ?? [],
    isLoopable: dto.isLoopable,
    sourceType: mapVisibilityToSourceType(dto.visibility),
    contentSource: 'own',
    isPremium: dto.isPremium,
    uploadMeta: {
      originalFileName: dto.fileName,
      fileSizeBytes: dto.fileSize,
      mimeType: dto.contentType,
      uploadedAt: dto.createdAt,
      storageKey: dto.storageKey,
      playbackUrl: dto.playbackUrl || undefined,
      remoteThumbnailUrl: remoteThumbnail ?? undefined,
      thumbnailStorageKey: dto.thumbnailStorageKey ?? undefined,
      provider,
    },
  };
}

export function workoutVideoToCreateRequest(video: WorkoutVideo): CreateUploadedVideoRequest {
  const meta = video.uploadMeta;
  if (!meta?.storageKey?.trim()) {
    throw new Error('Uploaded video metadata is incomplete');
  }

  const fileName = meta.originalFileName?.trim() || 'upload.mp4';
  const contentType = meta.mimeType?.trim() || 'video/mp4';
  const fileSize = Number.isFinite(meta.fileSizeBytes) ? meta.fileSizeBytes : 0;

  return {
    id: video.id,
    title: video.title,
    description: video.description,
    durationSec: video.durationSec,
    difficulty: video.difficulty,
    bodyParts: video.bodyParts,
    tags: video.tags,
    isLoopable: video.isLoopable,
    visibility: mapSourceTypeToVisibility(video.sourceType),
    isPremium: video.isPremium ?? false,
    storageKey: meta.storageKey,
    playbackUrl: meta.playbackUrl ?? video.previewUrl ?? '',
    thumbnailUrl:
      resolveHttpThumbnailUrl(meta.remoteThumbnailUrl) ??
      resolveHttpThumbnailUrl(video.thumbnailUrl),
    thumbnailStorageKey: meta.thumbnailStorageKey ?? null,
    fileName,
    fileSize,
    contentType,
    provider: meta.provider ?? 'r2',
  };
}

export function workoutVideoToUpdateRequest(
  input: UpdateWorkoutVideoInputLike,
): UpdateUploadedVideoRequest {
  return {
    title: input.title,
    description: input.description,
    durationSec: input.durationSec,
    difficulty: input.difficulty,
    bodyParts: input.bodyParts,
    tags: input.tags,
    isLoopable: input.isLoopable,
    visibility: mapSourceTypeToVisibility(input.sourceType),
    isPremium: input.isPremium,
  };
}

interface UpdateWorkoutVideoInputLike {
  title: string;
  description?: string;
  durationSec: number;
  difficulty: WorkoutDifficulty;
  bodyParts: string[];
  tags: string[];
  isLoopable: boolean;
  sourceType: WorkoutVideo['sourceType'];
  isPremium?: boolean;
}

export function programTemplateDtoToWorkoutProgramTemplate(
  dto: ProgramTemplateDto,
): WorkoutProgramTemplate | null {
  if (!dto.templateJson || typeof dto.templateJson !== 'object' || Array.isArray(dto.templateJson)) {
    return null;
  }

  const template = dto.templateJson as WorkoutProgramTemplate;
  const videoMap = buildWorkoutVideoMap(getCatalogVideos());
  const normalized = normalizeWorkoutProgramTemplate(
    {
      ...template,
      blocks: Array.isArray(template.blocks) ? template.blocks : [],
      tags: Array.isArray(template.tags) ? template.tags : [],
    },
    videoMap,
  );
  const visibility = normalizeTemplateVisibility(dto.visibility || template.visibility || 'private');
  const status = normalizeTemplateStatus(dto.status || template.status || 'draft');
  const publicReviewStatus =
    dto.publicReviewStatus && isTemplatePublicReviewStatus(dto.publicReviewStatus)
      ? dto.publicReviewStatus
      : template.publicReviewStatus;

  return {
    ...normalized,
    id: dto.id,
    title: dto.title,
    description: dto.description || template.description,
    visibility,
    status,
    publicReviewStatus,
    publicRejectionReason: dto.publicRejectionReason ?? template.publicRejectionReason,
    publicReviewedAt: dto.publicReviewedAt ?? template.publicReviewedAt,
    publicReviewedBy: dto.publicReviewedBy ?? template.publicReviewedBy,
    shareToken: dto.shareToken ?? template.shareToken ?? null,
    shareEnabled: dto.shareEnabled ?? template.shareEnabled ?? false,
    publishedAt: dto.publishedAt ?? template.publishedAt ?? null,
    unpublishedAt: dto.unpublishedAt ?? template.unpublishedAt ?? null,
    totalDurationSec: dto.totalDurationSec || normalized.totalDurationSec,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

export function workoutProgramTemplateToCreateRequest(
  template: WorkoutProgramTemplate,
): CreateProgramTemplateRequest {
  return {
    id: template.id,
    title: template.title,
    description: template.description,
    visibility: template.visibility,
    status: template.status ?? mapTemplateVisibilityToStatus(template.visibility),
    totalDurationSec: template.totalDurationSec,
    templateJson: template,
  };
}

export function workoutProgramTemplateToUpdateRequest(
  template: WorkoutProgramTemplate,
): UpdateProgramTemplateRequest {
  return {
    title: template.title,
    description: template.description,
    visibility: template.visibility,
    status: template.status ?? mapTemplateVisibilityToStatus(template.visibility),
    totalDurationSec: template.totalDurationSec,
    templateJson: template,
  };
}

export async function fetchUploadedVideos(): Promise<UploadedVideoDto[]> {
  const response = await requestJson<WorkoutBuilderApiListResponse<UploadedVideoDto>>(
    WORKOUT_BUILDER_API_PATHS.videos,
  );
  return response.data;
}

export async function createUploadedVideoApi(
  request: CreateUploadedVideoRequest,
): Promise<UploadedVideoDto> {
  const response = await requestJson<WorkoutBuilderApiItemResponse<UploadedVideoDto>>(
    WORKOUT_BUILDER_API_PATHS.videos,
    {
      method: 'POST',
      body: JSON.stringify(request),
    },
  );
  return response.data;
}

export async function updateUploadedVideoApi(
  id: string,
  request: UpdateUploadedVideoRequest,
): Promise<UploadedVideoDto> {
  const response = await requestJson<WorkoutBuilderApiItemResponse<UploadedVideoDto>>(
    `${WORKOUT_BUILDER_API_PATHS.videos}/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(request),
    },
  );
  return response.data;
}

export async function deleteUploadedVideoApi(id: string): Promise<DeleteUploadedVideoResponse> {
  const response = await requestJson<WorkoutBuilderApiItemResponse<DeleteUploadedVideoResponse>>(
    `${WORKOUT_BUILDER_API_PATHS.videos}/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    },
  );
  return response.data;
}

export async function fetchProgramTemplates(): Promise<ProgramTemplateDto[]> {
  const response = await requestJson<WorkoutBuilderApiListResponse<ProgramTemplateDto>>(
    WORKOUT_BUILDER_API_PATHS.templates,
  );
  return response.data;
}

export async function fetchProgramTemplateById(id: string): Promise<ProgramTemplateDto | null> {
  try {
    const response = await requestJson<WorkoutBuilderApiItemResponse<ProgramTemplateDto>>(
      `${WORKOUT_BUILDER_API_PATHS.templates}/${encodeURIComponent(id)}`,
    );
    return response.data;
  } catch (error) {
    if (error instanceof WorkoutBuilderApiError && error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function createProgramTemplateApi(
  request: CreateProgramTemplateRequest,
): Promise<ProgramTemplateDto> {
  const response = await requestJson<WorkoutBuilderApiItemResponse<ProgramTemplateDto>>(
    WORKOUT_BUILDER_API_PATHS.templates,
    {
      method: 'POST',
      body: JSON.stringify(request),
    },
  );
  return response.data;
}

export async function updateProgramTemplateApi(
  id: string,
  request: UpdateProgramTemplateRequest,
): Promise<ProgramTemplateDto> {
  const response = await requestJson<WorkoutBuilderApiItemResponse<ProgramTemplateDto>>(
    `${WORKOUT_BUILDER_API_PATHS.templates}/${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(request),
    },
  );
  return response.data;
}

export async function deleteProgramTemplateApi(id: string): Promise<void> {
  await requestJson(`${WORKOUT_BUILDER_API_PATHS.templates}/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });
}

export async function submitTemplateForPublicApi(
  id: string,
  request: SubmitPublicTemplateRequest = {},
): Promise<ProgramTemplateDto> {
  const response = await requestJson<WorkoutBuilderApiItemResponse<ProgramTemplateDto>>(
    `${WORKOUT_BUILDER_API_PATHS.templates}/${encodeURIComponent(id)}/submit-public`,
    {
      method: 'POST',
      body: JSON.stringify(request),
    },
  );
  return response.data;
}

export async function fetchPublicTemplateSubmissionsApi(): Promise<ProgramTemplateDto[]> {
  const response = await requestJson<WorkoutBuilderApiListResponse<ProgramTemplateDto>>(
    WORKOUT_BUILDER_API_PATHS.adminPublicSubmissions,
  );
  return response.data;
}

export async function approvePublicTemplateApi(id: string): Promise<ProgramTemplateDto> {
  const response = await requestJson<WorkoutBuilderApiItemResponse<ProgramTemplateDto>>(
    `${WORKOUT_BUILDER_API_PATHS.adminPublicSubmissions}/${encodeURIComponent(id)}/approve`,
    {
      method: 'POST',
    },
  );
  return response.data;
}

export async function rejectPublicTemplateApi(
  id: string,
  request: RejectPublicTemplateRequest,
): Promise<ProgramTemplateDto> {
  const response = await requestJson<WorkoutBuilderApiItemResponse<ProgramTemplateDto>>(
    `${WORKOUT_BUILDER_API_PATHS.adminPublicSubmissions}/${encodeURIComponent(id)}/reject`,
    {
      method: 'POST',
      body: JSON.stringify(request),
    },
  );
  return response.data;
}

export async function upsertUploadedVideoApi(video: WorkoutVideo): Promise<UploadedVideoDto> {
  try {
    return await updateUploadedVideoApi(
      video.id,
      workoutVideoToUpdateRequest({
        title: video.title,
        description: video.description,
        durationSec: video.durationSec,
        difficulty: video.difficulty,
        bodyParts: video.bodyParts,
        tags: video.tags,
        isLoopable: video.isLoopable,
        sourceType: video.sourceType,
        isPremium: video.isPremium,
      }),
    );
  } catch (error) {
    if (error instanceof WorkoutBuilderApiError && error.status === 404) {
      return createUploadedVideoApi(workoutVideoToCreateRequest(video));
    }
    throw error;
  }
}

export async function upsertProgramTemplateApi(
  template: WorkoutProgramTemplate,
): Promise<ProgramTemplateDto> {
  try {
    return await updateProgramTemplateApi(
      template.id,
      workoutProgramTemplateToUpdateRequest(template),
    );
  } catch (error) {
    if (error instanceof WorkoutBuilderApiError && error.status === 404) {
      return createProgramTemplateApi(workoutProgramTemplateToCreateRequest(template));
    }
    throw error;
  }
}
