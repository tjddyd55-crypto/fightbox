import type { TemplateVisibility } from '../types/workoutProgramBuilder.types';

export const VISIBILITY_LABEL: Record<TemplateVisibility, string> = {
  private: '비공개',
  gym_only: '체육관',
  public_pending: '승인 대기',
  public: '공개',
  public_rejected: '반려',
};

export function isPublicReviewPending(visibility: TemplateVisibility): boolean {
  return visibility === 'public_pending';
}

export function isPublicRejected(visibility: TemplateVisibility): boolean {
  return visibility === 'public_rejected';
}

export function isPublicApproved(visibility: TemplateVisibility): boolean {
  return visibility === 'public';
}
