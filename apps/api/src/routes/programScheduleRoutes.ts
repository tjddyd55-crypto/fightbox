import { Router } from 'express';
import { requirePermission } from '../middleware/permissions.js';
import {
  createProgramScheduleEntry,
  deleteProgramScheduleEntry,
  listProgramScheduleEntries,
  updateProgramScheduleEntry,
} from '../repositories/programScheduleRepository.js';
import { ApiError, toErrorResponse } from '../utils/apiError.js';
import {
  parseCreateProgramScheduleBody,
  parseUpdateProgramScheduleBody,
} from '../utils/programScheduleValidation.js';

const router = Router();

function routeParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

router.get('/entries', requirePermission('viewProgramSchedule'), async (req, res) => {
  try {
    const data = await listProgramScheduleEntries(req.fightboxContext.gymId);
    res.status(200).json({ data });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

router.post('/entries', requirePermission('manageProgramSchedule'), async (req, res) => {
  try {
    const input = parseCreateProgramScheduleBody(req.body);
    const data = await createProgramScheduleEntry({
      ...input,
      gymId: req.fightboxContext.gymId,
      createdBy: req.fightboxContext.userId,
    });
    res.status(201).json({ data });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

router.patch('/entries/:id', requirePermission('manageProgramSchedule'), async (req, res) => {
  try {
    const id = routeParam(req.params.id).trim();
    if (!id) {
      throw new ApiError(400, 'INVALID_ID', 'Schedule entry id is required');
    }

    const input = parseUpdateProgramScheduleBody(req.body);
    const data = await updateProgramScheduleEntry(id, req.fightboxContext.gymId, input);
    res.status(200).json({ data });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

router.delete('/entries/:id', requirePermission('manageProgramSchedule'), async (req, res) => {
  try {
    const id = routeParam(req.params.id).trim();
    if (!id) {
      throw new ApiError(400, 'INVALID_ID', 'Schedule entry id is required');
    }

    await deleteProgramScheduleEntry(id, req.fightboxContext.gymId);
    res.status(200).json({ data: { ok: true } });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

export default router;
