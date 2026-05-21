import type { UploadProviderKind } from '../types/videoUpload.types';

const DEFAULT_UPLOAD_PROVIDER: UploadProviderKind = 'mock';

export function resolveUploadProviderKind(): UploadProviderKind {
  const raw = import.meta.env.VITE_VIDEO_UPLOAD_PROVIDER?.trim().toLowerCase();
  if (raw === 'api') {
    return 'api';
  }
  return DEFAULT_UPLOAD_PROVIDER;
}

export function getApiBaseUrl(): string {
  const base = import.meta.env.VITE_API_BASE_URL?.trim();
  if (!base) {
    return '';
  }
  return base.replace(/\/$/, '');
}

export function resolveR2UploadIncludeContentType(): boolean {
  const raw = import.meta.env.VITE_R2_UPLOAD_INCLUDE_CONTENT_TYPE?.trim().toLowerCase();
  return raw === 'true';
}
