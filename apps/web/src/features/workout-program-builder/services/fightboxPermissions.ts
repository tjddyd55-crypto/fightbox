import {
  canCreateTemplates,
  canDeleteTemplates,
  canEditTemplates,
  canManageVideos,
  canReviewPublicTemplates,
  canSubmitPublicTemplates,
  canUploadVideos,
  FIGHTBOX_ROLE_LABELS,
} from '@fightbox/shared';
import { getFightboxClientContext } from './fightboxContextConfig';

export interface FightboxClientPermissions {
  roleLabel: string;
  canUploadVideos: boolean;
  canManageVideos: boolean;
  canCreateTemplates: boolean;
  canEditTemplates: boolean;
  canDeleteTemplates: boolean;
  canSubmitPublicTemplates: boolean;
  canReviewPublicTemplates: boolean;
}

export function getFightboxClientPermissions(): FightboxClientPermissions {
  const context = getFightboxClientContext();

  return {
    roleLabel: FIGHTBOX_ROLE_LABELS[context.role],
    canUploadVideos: canUploadVideos(context),
    canManageVideos: canManageVideos(context),
    canCreateTemplates: canCreateTemplates(context),
    canEditTemplates: canEditTemplates(context),
    canDeleteTemplates: canDeleteTemplates(context),
    canSubmitPublicTemplates: canSubmitPublicTemplates(context),
    canReviewPublicTemplates: canReviewPublicTemplates(context),
  };
}

export function canSaveTemplatePermission(
  permissions: FightboxClientPermissions,
  hasExistingTemplate: boolean,
): boolean {
  if (hasExistingTemplate) {
    return permissions.canEditTemplates;
  }
  return permissions.canCreateTemplates || permissions.canEditTemplates;
}
