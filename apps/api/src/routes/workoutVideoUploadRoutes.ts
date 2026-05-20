import { Router } from 'express';
import { createPresignedVideoUpload } from '../services/r2PresignService.js';
import { ApiError, toErrorResponse } from '../utils/apiError.js';

const router = Router();

router.post('/presign', async (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new ApiError(400, 'INVALID_BODY', 'Request body must be a JSON object');
    }

    const { fileName, fileSize, contentType, gymId, uploaderId } = body as Record<
      string,
      unknown
    >;

    if (typeof fileName !== 'string') {
      throw new ApiError(400, 'INVALID_BODY', 'fileName must be a string');
    }

    if (typeof fileSize !== 'number' || !Number.isFinite(fileSize)) {
      throw new ApiError(400, 'INVALID_BODY', 'fileSize must be a number');
    }

    if (typeof contentType !== 'string') {
      throw new ApiError(400, 'INVALID_BODY', 'contentType must be a string');
    }

    const result = await createPresignedVideoUpload({
      fileName,
      fileSize,
      contentType,
      ...(typeof gymId === 'string' ? { gymId } : {}),
      ...(typeof uploaderId === 'string' ? { uploaderId } : {}),
    });

    res.status(200).json(result);
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

export default router;
