import {
  canCreateTemplates,
  canDeleteTemplates,
  canEditTemplates,
  canManageGyms,
  canManageUsers,
  canManageStaffPermissions,
  canManageVideos,
  canReviewPublicTemplates,
  canSubmitPublicTemplates,
  canUploadVideos,
  canViewAuthAuditLogs,
  FIGHTBOX_ROLE_LABELS,
  sessionUserToRequestContext,
  type FightboxRequestContext,
} from '@fightbox/shared';
import type { FightboxSessionUser } from '@fightbox/shared';
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
  canManageStaffPermissions: boolean;
  canManageGyms: boolean;
  canManageUsers: boolean;
  canViewAuthAuditLogs: boolean;
}

function buildPermissions(context: FightboxRequestContext): FightboxClientPermissions {
  return {
    roleLabel: FIGHTBOX_ROLE_LABELS[context.role],
    canUploadVideos: canUploadVideos(context),
    canManageVideos: canManageVideos(context),
    canCreateTemplates: canCreateTemplates(context),
    canEditTemplates: canEditTemplates(context),
    canDeleteTemplates: canDeleteTemplates(context),
    canSubmitPublicTemplates: canSubmitPublicTemplates(context),
    canReviewPublicTemplates: canReviewPublicTemplates(context),
    canManageStaffPermissions: canManageStaffPermissions(context),
    canManageGyms: canManageGyms(context),
    canManageUsers: canManageUsers(context),
    canViewAuthAuditLogs: canViewAuthAuditLogs(context),
  };
}

export function getFightboxClientPermissions(
  context: FightboxRequestContext = getFightboxClientContext(),
): FightboxClientPermissions {
  return buildPermissions(context);
}

export function getFightboxClientPermissionsForUser(
  user: FightboxSessionUser,
): FightboxClientPermissions {
  return buildPermissions(sessionUserToRequestContext(user));
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
