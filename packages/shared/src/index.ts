export const FIGHTBOX_SHARED_VERSION = '0.1.0';

export {
  DEFAULT_STAFF_PERMISSIONS,
  FIGHTBOX_ROLE_LABELS,
  canCreateTemplates,
  canDeleteTemplates,
  canEditTemplates,
  canManageStaffPermissions,
  canManageVideos,
  canReviewPublicTemplates,
  canSubmitPublicTemplates,
  canUploadVideos,
  hasAnyFightboxPermission,
  hasFightboxPermission,
  isFightboxUserRole,
  parseStaffPermissionsJson,
  sessionUserToRequestContext,
  type FightboxPermission,
  type FightboxRequestContext,
  type FightboxSessionUser,
  type FightboxStaffPermissions,
  type FightboxUserRole,
} from './authContext.js';

export { DEMO_ACCOUNTS, type DemoAccount } from './demoAccounts.js';

export {
  WORKOUT_VIDEO_PRESIGN_PATH,
  type PresignAssetType,
  type PresignedVideoUploadDebug,
  type PresignedVideoUploadRequest,
  type PresignedVideoUploadResponse,
  type R2PresignUrlStyle,
} from './videoUploadContract.js';

export {
  WORKOUT_BUILDER_API_PATHS,
  type CreateProgramTemplateRequest,
  type CreateUploadedVideoRequest,
  type DeleteUploadedVideoResponse,
  type ProgramTemplateDto,
  type R2DeleteResult,
  type RejectPublicTemplateRequest,
  type SubmitPublicTemplateRequest,
  type TemplatePublicReviewStatus,
  type TemplateStatus,
  type TemplateVisibility,
  type UpdateProgramTemplateRequest,
  type UpdateUploadedVideoRequest,
  type UploadedVideoDto,
  type WorkoutBuilderApiItemResponse,
  type WorkoutBuilderApiListResponse,
} from './workoutBuilderContracts.js';
