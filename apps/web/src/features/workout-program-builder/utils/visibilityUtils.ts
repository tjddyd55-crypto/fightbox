import type { TemplateVisibility } from '../types/workoutProgramBuilder.types';

export const VISIBILITY_LABEL: Record<TemplateVisibility, string> = {
  private: '비공개',
  gym: '체육관',
  public_pending: '승인 대기',
  public_approved: '공개',
  public_rejected: '반려',
};

export function isPublicReviewPending(visibility: TemplateVisibility): boolean {
  return visibility === 'public_pending';
}
