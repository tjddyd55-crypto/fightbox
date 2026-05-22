import type { FightboxSessionUser } from '@fightbox/shared';
import { getApiBaseUrl } from '../workout-program-builder/services/videoUploadConfig';
import { getMyStaffPermissions } from './staffPermissionApiClient';

export async function hydrateStaffPermissionsForUser(
  user: FightboxSessionUser,
): Promise<FightboxSessionUser> {
  if (user.role !== 'gym_staff') {
    return user;
  }

  if (!getApiBaseUrl()) {
    return user;
  }

  try {
    const { permissions } = await getMyStaffPermissions(user);
    return {
      ...user,
      staffPermissions: permissions,
    };
  } catch (error) {
    console.warn('[auth] failed to hydrate staff permissions', error);
    return user;
  }
}
