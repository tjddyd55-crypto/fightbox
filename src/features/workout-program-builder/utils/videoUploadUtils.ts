import type { CreateWorkoutVideoInput } from '../types/workoutProgramBuilder.types';

export interface VideoUploadFormValues {
  file: File | null;
  title: string;
  description: string;
  tagsText: string;
  bodyParts: string[];
  difficulty: CreateWorkoutVideoInput['difficulty'] | '';
  durationSec: number;
}

export interface VideoUploadValidationResult {
  isValid: boolean;
  fieldErrors: Partial<Record<keyof VideoUploadFormValues | 'form', string>>;
}

export function parseTagsInput(tagsText: string): string[] {
  return tagsText
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function formatFileSizeMb(bytes: number): string {
  if (bytes <= 0) return '0 MB';
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function readVideoDurationFromFile(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';

    const cleanup = () => {
      URL.revokeObjectURL(url);
      video.removeAttribute('src');
      video.load();
    };

    video.onloadedmetadata = () => {
      const duration = Number.isFinite(video.duration) ? video.duration : 0;
      cleanup();
      if (duration <= 0) {
        reject(new Error('영상 길이를 읽을 수 없습니다.'));
        return;
      }
      resolve(Math.max(1, Math.round(duration)));
    };

    video.onerror = () => {
      cleanup();
      reject(new Error('영상 메타데이터를 읽을 수 없습니다.'));
    };

    video.src = url;
  });
}

export function validateVideoUploadForm(
  values: VideoUploadFormValues,
): VideoUploadValidationResult {
  const fieldErrors: VideoUploadValidationResult['fieldErrors'] = {};

  if (!values.file) {
    fieldErrors.file = '영상 파일을 선택해 주세요.';
  }

  const title = values.title.trim();
  if (!title) {
    fieldErrors.title = '제목을 입력해 주세요.';
  }

  if (values.durationSec <= 0) {
    fieldErrors.durationSec = '길이는 1초 이상이어야 합니다.';
  }

  if (!values.difficulty) {
    fieldErrors.difficulty = '난이도를 선택해 주세요.';
  }

  if (values.bodyParts.length === 0) {
    fieldErrors.bodyParts = '운동 부위를 최소 1개 선택해 주세요.';
  }

  const tags = parseTagsInput(values.tagsText);
  if (tags.length === 0) {
    fieldErrors.tagsText = '태그를 최소 1개 입력해 주세요.';
  }

  return {
    isValid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
  };
}

export function buildCreateVideoInput(
  values: VideoUploadFormValues,
  options: {
    visibility: CreateWorkoutVideoInput['visibility'];
    isLoopable: boolean;
    isPremium: boolean;
  },
): CreateWorkoutVideoInput | null {
  if (!values.file || !values.difficulty) return null;

  return {
    title: values.title.trim(),
    description: values.description.trim() || undefined,
    durationSec: values.durationSec,
    tags: parseTagsInput(values.tagsText),
    bodyParts: values.bodyParts,
    difficulty: values.difficulty,
    isLoopable: options.isLoopable,
    visibility: options.visibility,
    isPremium: options.isPremium,
    originalFileName: values.file.name,
    fileSizeBytes: values.file.size,
    mimeType: values.file.type || 'video/*',
  };
}
