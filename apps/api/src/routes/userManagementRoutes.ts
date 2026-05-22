import { Router } from 'express';
import { requirePermission } from '../middleware/permissions.js';
import {
  createManagedUser,
  disableManagedUser,
  findManagedUserById,
  listManagedUsers,
  updateManagedUser,
} from '../repositories/userManagementRepository.js';
import { ApiError, toErrorResponse } from '../utils/apiError.js';
import {
  parseCreateManagedUserBody,
  parseListManagedUsersQuery,
  parseUpdateManagedUserBody,
} from '../utils/userManagementValidation.js';

const router = Router();

function routeParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

router.get('/', requirePermission('manageUsers'), async (req, res) => {
  try {
    const filters = parseListManagedUsersQuery(
      req.query as Record<string, unknown>,
    );
    const data = await listManagedUsers(req.fightboxContext, filters);
    res.status(200).json({ data });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

router.post('/', requirePermission('manageUsers'), async (req, res) => {
  try {
    const input = parseCreateManagedUserBody(req.body);
    const data = await createManagedUser(input, req.fightboxContext);
    res.status(201).json({ data });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

router.patch('/:userId', requirePermission('manageUsers'), async (req, res) => {
  try {
    const userId = routeParam(req.params.userId).trim();
    if (!userId) {
      throw new ApiError(400, 'INVALID_USER_ID', 'userId is required');
    }

    const existing = await findManagedUserById(userId, req.fightboxContext);
    if (!existing) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const input = parseUpdateManagedUserBody(req.body);
    const data = await updateManagedUser(userId, input, req.fightboxContext);
    res.status(200).json({ data });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

router.delete('/:userId', requirePermission('manageUsers'), async (req, res) => {
  try {
    const userId = routeParam(req.params.userId).trim();
    if (!userId) {
      throw new ApiError(400, 'INVALID_USER_ID', 'userId is required');
    }

    const existing = await findManagedUserById(userId, req.fightboxContext);
    if (!existing) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'User not found');
    }

    const data = await disableManagedUser(userId, req.fightboxContext);
    res.status(200).json({ data });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

export default router;
