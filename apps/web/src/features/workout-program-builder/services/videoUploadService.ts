import type {
  PresignedUploadRequest,
  PresignedUploadResponse,
  ThumbnailUploadResult,
  UploadGeneratedThumbnailParams,
  UploadProviderKind,
  UploadVideoFileParams,
  VideoUploadAdapter,
  VideoUploadResult,
  VideoUploadStatus,
} from '../types/videoUpload.types';
import { apiVideoUploadAdapter } from './apiVideoUploadAdapter';
import { mockVideoUploadAdapter } from './mockVideoUploadAdapter';
import { resolveUploadProviderKind } from './videoUploadConfig';

function selectAdapter(kind: UploadProviderKind): VideoUploadAdapter {
  return kind === 'api' ? apiVideoUploadAdapter : mockVideoUploadAdapter;
}

function getActiveAdapter(): VideoUploadAdapter {
  return selectAdapter(resolveUploadProviderKind());
}

/** Currently configured upload provider (from env). */
export const activeVideoUploadProvider: UploadProviderKind = resolveUploadProviderKind();

export async function requestPresignedUpload(
  input: PresignedUploadRequest,
): Promise<PresignedUploadResponse> {
  return getActiveAdapter().requestPresignedUpload(input);
}

export async function uploadVideoFile(
  params: UploadVideoFileParams,
): Promise<VideoUploadResult> {
  return getActiveAdapter().uploadVideoFile(params);
}

export async function uploadGeneratedThumbnail(
  params: UploadGeneratedThumbnailParams,
): Promise<ThumbnailUploadResult | undefined> {
  return getActiveAdapter().uploadGeneratedThumbnail(params);
}

export function getUploadStatusLabel(status: VideoUploadStatus, progress: number): string {
  switch (status) {
    case 'generating-thumbnail':
      return '썸네일 생성 중…';
    case 'preparing':
      return '업로드 준비 중…';
    case 'uploading':
      return `업로드 중 ${progress}%`;
    case 'uploading-thumbnail':
      return `썸네일 업로드 중 ${progress}%`;
    case 'processing':
      return '영상 처리 중…';
    case 'completed':
      return '업로드 완료';
    case 'failed':
      return '업로드 실패';
    default:
      return '';
  }
}
