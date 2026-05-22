import { Router } from 'express';
import { DEMO_ACCOUNTS } from '@fightbox/shared';
import { requirePermission } from '../middleware/permissions.js';
import {
  getGymStaffPermission,
  listGymStaffPermissions,
  updateGymStaffPermissions,
} from '../repositories/gymStaffPermissionRepository.js';
import { ApiError, toErrorResponse } from '../utils/apiError.js';
import {
  parseUpdateStaffPermissionsBody,
  resolveEffectiveStaffPermissions,
} from '../utils/staffPermissionValidation.js';

const router = Router();

function routeParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

function findDemoStaffFallback(userId: string): { loginId: string; displayName: string } {
  const account = DEMO_ACCOUNTS.find((item) => item.user.userId === userId);
  if (account) {
    return {
      loginId: account.user.loginId,
      displayName: account.user.displayName,
    };
  }
  return { loginId: userId, displayName: userId };
}

router.get('/me', async (req, res) => {
  try {
    const { gymId, userId, staffPermissions } = req.fightboxContext;
    const row = await getGymStaffPermission(gymId, userId);
    const permissions = resolveEffectiveStaffPermissions(
      row?.permissions ?? null,
      staffPermissions,
    );

    res.status(200).json({
      data: row,
      permissions,
    });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

router.get('/', requirePermission('manageStaffPermissions'), async (req, res) => {
  try {
    const data = await listGymStaffPermissions(req.fightboxContext.gymId);
    res.status(200).json({ data });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

router.patch(
  '/:userId',
  requirePermission('manageStaffPermissions'),
  async (req, res) => {
    try {
      const userId = routeParam(req.params.userId).trim();
      if (!userId) {
        throw new ApiError(400, 'INVALID_USER_ID', 'userId is required');
      }

      const { permissions } = parseUpdateStaffPermissionsBody(req.body);
      const fallback = findDemoStaffFallback(userId);
      const data = await updateGymStaffPermissions(
        req.fightboxContext.gymId,
        userId,
        permissions,
        fallback,
      );

      res.status(200).json({ data });
    } catch (error) {
      const { status, body } = toErrorResponse(error);
      res.status(status).json(body);
    }
  },
);

export default router;
