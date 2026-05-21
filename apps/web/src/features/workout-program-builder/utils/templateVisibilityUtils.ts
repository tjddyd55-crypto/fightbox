import type { TemplateStatus, TemplateVisibility } from '@fightbox/shared';

const LEGACY_VISIBILITY_MAP: Record<string, TemplateVisibility> = {
  gym: 'gym_only',
  public_approved: 'public',
};

const LEGACY_STATUS_MAP: Record<string, TemplateStatus> = {
  pending_review: 'active',
  published: 'active',
  rejected: 'active',
};

export function normalizeTemplateVisibility(value: string): TemplateVisibility {
  const mapped = LEGACY_VISIBILITY_MAP[value] ?? value;
  if (
    mapped === 'private' ||
    mapped === 'gym_only' ||
    mapped === 'public_pending' ||
    mapped === 'public' ||
    mapped === 'public_rejected'
  ) {
    return mapped;
  }
  return 'private';
}

export function normalizeTemplateStatus(value: string): TemplateStatus {
  const mapped = LEGACY_STATUS_MAP[value] ?? value;
  if (mapped === 'draft' || mapped === 'active' || mapped === 'archived') {
    return mapped;
  }
  return 'draft';
}

export function isTemplateVisibility(value: string): value is TemplateVisibility {
  return normalizeTemplateVisibility(value) === value;
}

export function mapTemplateVisibilityToStatus(visibility: TemplateVisibility): TemplateStatus {
  if (visibility === 'public_rejected') {
    return 'active';
  }
  return 'active';
}
