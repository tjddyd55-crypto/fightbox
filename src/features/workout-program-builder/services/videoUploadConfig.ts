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
    throw new Error(
      'VITE_API_BASE_URL is required when VITE_VIDEO_UPLOAD_PROVIDER=api',
    );
  }
  return base.replace(/\/$/, '');
}
