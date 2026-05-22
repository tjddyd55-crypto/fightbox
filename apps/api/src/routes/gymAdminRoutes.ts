import { Router } from 'express';
import type { CreateGymRequest, UpdateGymRequest } from '@fightbox/shared';
import { requirePermission } from '../middleware/permissions.js';
import {
  createGym,
  getGymById,
  listGyms,
  softDeleteGym,
  updateGym,
} from '../repositories/gymRepository.js';
import { ApiError, toErrorResponse } from '../utils/apiError.js';

const router = Router();

function routeParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

function parseCreateBody(body: unknown): CreateGymRequest {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'INVALID_BODY', 'Request body must be an object');
  }
  const source = body as Record<string, unknown>;
  if (typeof source.gymCode !== 'string' || typeof source.name !== 'string') {
    throw new ApiError(400, 'INVALID_BODY', 'gymCode and name are required');
  }

  return {
    gymCode: source.gymCode,
    name: source.name,
    ...(typeof source.ownerName === 'string' ? { ownerName: source.ownerName } : {}),
    ...(typeof source.phone === 'string' ? { phone: source.phone } : {}),
    ...(typeof source.address === 'string' ? { address: source.address } : {}),
    ...(typeof source.memo === 'string' ? { memo: source.memo } : {}),
    ...(typeof source.status === 'string' ? { status: source.status as CreateGymRequest['status'] } : {}),
  };
}

function parseUpdateBody(body: unknown): UpdateGymRequest {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'INVALID_BODY', 'Request body must be an object');
  }
  const source = body as Record<string, unknown>;
  const patch: UpdateGymRequest = {};

  if (typeof source.gymCode === 'string') patch.gymCode = source.gymCode;
  if (typeof source.name === 'string') patch.name = source.name;
  if (typeof source.ownerName === 'string') patch.ownerName = source.ownerName;
  if (typeof source.phone === 'string') patch.phone = source.phone;
  if (typeof source.address === 'string') patch.address = source.address;
  if (typeof source.memo === 'string') patch.memo = source.memo;
  if (typeof source.status === 'string') patch.status = source.status as UpdateGymRequest['status'];

  if (Object.keys(patch).length === 0) {
    throw new ApiError(400, 'INVALID_BODY', 'At least one field is required');
  }

  return patch;
}

router.get('/', requirePermission('manageGyms'), async (_req, res) => {
  try {
    const data = await listGyms();
    res.status(200).json({ data });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

router.get('/:id', requirePermission('manageGyms'), async (req, res) => {
  try {
    const id = routeParam(req.params.id).trim();
    const data = await getGymById(id);
    if (!data) {
      throw new ApiError(404, 'GYM_NOT_FOUND', 'Gym not found');
    }
    res.status(200).json({ data });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

router.post('/', requirePermission('manageGyms'), async (req, res) => {
  try {
    const input = parseCreateBody(req.body);
    const data = await createGym(input, req.fightboxContext.userId);
    res.status(201).json({ data });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

router.patch('/:id', requirePermission('manageGyms'), async (req, res) => {
  try {
    const id = routeParam(req.params.id).trim();
    const input = parseUpdateBody(req.body);
    const data = await updateGym(id, input);
    if (!data) {
      throw new ApiError(404, 'GYM_NOT_FOUND', 'Gym not found');
    }
    res.status(200).json({ data });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

router.delete('/:id', requirePermission('manageGyms'), async (req, res) => {
  try {
    const id = routeParam(req.params.id).trim();
    const deleted = await softDeleteGym(id);
    if (!deleted) {
      throw new ApiError(404, 'GYM_NOT_FOUND', 'Gym not found');
    }
    res.status(200).json({ data: { id, deleted: true } });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

export default router;
