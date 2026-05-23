import { Router } from 'express';
import { getPublishedProgramByShareToken } from '../services/programShareService.js';
import { ApiError, toErrorResponse } from '../utils/apiError.js';

const router = Router();

function routeParam(value: string | string[]): string {
  return Array.isArray(value) ? (value[0] ?? '') : value;
}

router.get('/:shareToken', async (req, res) => {
  try {
    const shareToken = routeParam(req.params.shareToken).trim();
    if (!shareToken) {
      throw new ApiError(400, 'INVALID_TOKEN', 'Share token is required');
    }

    const data = await getPublishedProgramByShareToken(shareToken);
    if (!data) {
      throw new ApiError(404, 'NOT_FOUND', 'Shared program not found or unavailable');
    }

    res.status(200).json({ data });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

export default router;
