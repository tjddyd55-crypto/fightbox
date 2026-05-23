export const FIGHTBOX_SHARED_VERSION = '0.1.0';

export {
  CREATOR_SCOPE_GYM_FALLBACK,
  DEFAULT_STAFF_PERMISSIONS,
  FIGHTBOX_ROLE_LABELS,
  canCreateTemplates,
  canDeleteTemplates,
  canEditTemplates,
  canManageGyms,
  canManageBilling,
  canManageUserRole,
  canManageUsers,
  canManageStaffPermissions,
  canManageVideos,
  canPurchaseCredits,
  canReviewPublicTemplates,
  canSubmitPublicTemplates,
  canUploadVideos,
  canViewBilling,
  canViewAuthAuditLogs,
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
  AUTH_API_PATHS,
  authUserDtoToSessionUser,
  type AuthMeResponse,
  type AuthUserDto,
  type FightboxJwtPayload,
  type LoginRequest,
  type LoginResponse,
} from './authContracts.js';

export {
  AUTH_AUDIT_API_PATHS,
  type AuthAuditEventType,
  type AuthAuditLogDto,
  type ListAuthAuditLogsResponse,
} from './authAuditContracts.js';

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
  USER_MANAGEMENT_API_PATHS,
  type CreateManagedUserRequest,
  type ListManagedUsersQuery,
  type ManagedUserDto,
  type ManagedUserItemResponse,
  type ManagedUserListResponse,
  type ManagedUserStatus,
  type UpdateManagedUserRequest,
} from './userManagementContracts.js';

export {
  PROGRAM_SHARE_API_PATHS,
  type PublicProgramShareResponse,
  type PublishProgramTemplateResponse,
  type PublishedProgramPlaybackItemDto,
  type PublishedProgramShareDto,
  type UnpublishProgramTemplateResponse,
} from './programShareContracts.js';

export {
  BILLING_API_PATHS,
  type BillingLedgerResponse,
  type BillingOrdersResponse,
  type BillingProductsResponse,
  type BillingWalletResponse,
  type BillingWalletsResponse,
  type CreatePaymentOrderRequest,
  type CreatePaymentOrderResponse,
  type CreditLedgerEntryDto,
  type CreditLedgerEntryType,
  type CreditWalletDto,
  type ManualCreditAdjustmentRequest,
  type ManualCreditAdjustmentResponse,
  type PaymentOrderDto,
  type PaymentOrderStatus,
  type PaymentProductDto,
} from './billingContracts.js';

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
