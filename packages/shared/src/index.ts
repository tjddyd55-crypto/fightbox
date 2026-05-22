export const FIGHTBOX_SHARED_VERSION = '0.1.0';

export {
  CREATOR_SCOPE_GYM_FALLBACK,
  DEFAULT_STAFF_PERMISSIONS,
  FIGHTBOX_ROLE_LABELS,
  canCreateTemplates,
  canDeleteTemplates,
  canEditTemplates,
  canManageGyms,
  canManageStaffPermissions,
  canManageVideos,
  canReviewPublicTemplates,
  canSubmitPublicTemplates,
  canUploadVideos,
  hasAnyFightboxPermission,
  hasFightboxPermission,
  inferAccountScopeFromRole,
  isFightboxAccountScope,
  isFightboxUserRole,
  parseStaffPermissionsJson,
  sessionUserToRequestContext,
  type FightboxAccountScope,
  type FightboxPermission,
  type FightboxRequestContext,
  type FightboxSessionUser,
  type FightboxStaffPermissions,
  type FightboxUserRole,
} from './authContext.js';

export { DEMO_ACCOUNTS, type DemoAccount } from './demoAccounts.js';

export {
  GYM_API_PATHS,
  type CreateGymRequest,
  type GymDto,
  type GymItemResponse,
  type GymListResponse,
  type GymStatus,
  type UpdateGymRequest,
} from './gymContracts.js';

export {
  STAFF_PERMISSION_API_PATHS,
  STAFF_PERMISSION_FIELD_KEYS,
  type GymStaffPermissionDto,
  type GymStaffPermissionItemResponse,
  type GymStaffPermissionListResponse,
  type MyStaffPermissionsResponse,
  type UpdateGymStaffPermissionsRequest,
} from './staffPermissionContracts.js';

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
