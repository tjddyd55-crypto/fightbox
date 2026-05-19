export type UserRole =
  | 'superAdmin'
  | 'gymOwner'
  | 'coach'
  | 'staff'
  | 'playbackOnly';

export type PermissionKey =
  | 'builder.access'
  | 'builder.edit'
  | 'builder.publish'
  | 'builder.playback';

export type CreditTransactionType =
  | 'earn_upload'
  | 'earn_share_approved'
  | 'spend_premium_video'
  | 'spend_public_template'
  | 'adjustment';

export interface CreditWallet {
  balance: number;
  currencyLabel: string;
  updatedAt: string;
}

export interface CreditTransaction {
  id: string;
  type: CreditTransactionType;
  amount: number;
  label: string;
  createdAt: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  superAdmin: ['builder.access', 'builder.edit', 'builder.publish', 'builder.playback'],
  gymOwner: ['builder.access', 'builder.edit', 'builder.publish', 'builder.playback'],
  coach: ['builder.access', 'builder.edit', 'builder.playback'],
  staff: ['builder.access', 'builder.edit'],
  playbackOnly: ['builder.playback'],
};

export function roleHasPermission(role: UserRole, permission: PermissionKey): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
