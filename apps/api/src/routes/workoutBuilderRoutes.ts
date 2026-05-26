import { Router } from 'express';
import {
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
  isValidYouTubeVideoId,
  normalizeWorkoutVideoSourceType,
  parseYouTubeVideoId,
} from '@fightbox/shared';
import type {
  CreateProgramTemplateRequest,
  CreateUploadedVideoRequest,
  RejectPublicTemplateRequest,
  SubmitPublicTemplateRequest,
  UpdateProgramTemplateRequest,
  UpdateUploadedVideoRequest,
} from '@fightbox/shared';
import { DEFAULT_DEMO_ADMIN_ID } from '../constants/workoutBuilderConstants.js';
import { requireAnyPermission, requirePermission } from '../middleware/permissions.js';
import {
  approvePublicSubmission,
  createProgramTemplate,
  getProgramTemplate,
  listProgramTemplates,
  listPublicPendingSubmissions,
  rejectPublicSubmission,
  softDeleteProgramTemplate,
  submitProgramTemplateForPublic,
  unpublishProgramTemplate,
  updateProgramTemplate,
} from '../repositories/programTemplateRepository.js';
import {
  createUploadedVideo,
  deleteUploadedVideoWithMedia,
  listUploadedVideos,
  updateUploadedVideo,
} from '../repositories/workoutVideoRepository.js';
import { publishProgramTemplateWithCredits } from '../services/programPublishService.js';
import { ApiError, toErrorResponse } from '../utils/apiError.js';
import { buildProgramShareUrl } from '../utils/programShareUrl.js';

const router = Router();

function routeParam(value: string | string[]): string {
  return Array.isArray(value) ? (value[0] ?? '') : value;
}

function assertObjectBody(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'INVALID_BODY', 'Request body must be a JSON object');
  }
  return body as Record<string, unknown>;
}

function assertStringField(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  if (typeof value !== 'string' || !value.trim()) {
    throw new ApiError(400, 'INVALID_BODY', `${key} must be a non-empty string`);
  }
  return value.trim();
}

function assertNumberField(body: Record<string, unknown>, key: string): number {
  const value = body[key];
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ApiError(400, 'INVALID_BODY', `${key} must be a number`);
  }
  return value;
}

function assertStringArrayField(body: Record<string, unknown>, key: string): string[] {
  const value = body[key];
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new ApiError(400, 'INVALID_BODY', `${key} must be an array of strings`);
  }
  return value;
}

function assertBooleanField(body: Record<string, unknown>, key: string): boolean {
  const value = body[key];
  if (typeof value !== 'boolean') {
    throw new ApiError(400, 'INVALID_BODY', `${key} must be a boolean`);
  }
  return value;
}

function parseCreateUploadedVideoBody(body: Record<string, unknown>): CreateUploadedVideoRequest {
  const sourceType = normalizeWorkoutVideoSourceType(
    typeof body.sourceType === 'string' ? body.sourceType : undefined,
  );

  const base = {
    ...(typeof body.id === 'string' ? { id: body.id } : {}),
    title: assertStringField(body, 'title'),
    ...(typeof body.description === 'string' ? { description: body.description } : {}),
    durationSec: assertNumberField(body, 'durationSec'),
    difficulty: assertStringField(body, 'difficulty'),
    bodyParts: assertStringArrayField(body, 'bodyParts'),
    tags: assertStringArrayField(body, 'tags'),
    isLoopable: assertBooleanField(body, 'isLoopable'),
    visibility: assertStringField(body, 'visibility'),
    ...(typeof body.isPremium === 'boolean' ? { isPremium: body.isPremium } : {}),
    sourceType,
  };

  if (sourceType === 'youtube') {
    const externalUrl =
      typeof body.externalUrl === 'string' && body.externalUrl.trim()
        ? body.externalUrl.trim()
        : '';
    const externalVideoId =
      typeof body.externalVideoId === 'string' && body.externalVideoId.trim()
        ? body.externalVideoId.trim()
        : parseYouTubeVideoId(externalUrl) ?? '';

    if (!isValidYouTubeVideoId(externalVideoId)) {
      throw new ApiError(400, 'INVALID_BODY', 'Valid YouTube URL or video ID is required');
    }

    const embedUrl =
      typeof body.embedUrl === 'string' && body.embedUrl.trim()
        ? body.embedUrl.trim()
        : getYouTubeEmbedUrl(externalVideoId);

    const thumbnailUrl =
      body.thumbnailUrl === null || typeof body.thumbnailUrl === 'string'
        ? (body.thumbnailUrl as string | null) ?? getYouTubeThumbnailUrl(externalVideoId)
        : getYouTubeThumbnailUrl(externalVideoId);

    return {
      ...base,
      storageKey: '',
      playbackUrl: '',
      fileName: 'youtube',
      fileSize: 0,
      contentType: 'video/youtube',
      provider: 'youtube',
      externalProvider: 'youtube',
      externalVideoId,
      externalUrl: externalUrl || `https://www.youtube.com/watch?v=${externalVideoId}`,
      embedUrl,
      thumbnailUrl,
    };
  }

  return {
    ...base,
    storageKey: assertStringField(body, 'storageKey'),
    ...(typeof body.playbackUrl === 'string' ? { playbackUrl: body.playbackUrl } : {}),
    ...(body.thumbnailUrl === null || typeof body.thumbnailUrl === 'string'
      ? { thumbnailUrl: body.thumbnailUrl as string | null }
      : {}),
    ...(body.thumbnailStorageKey === null || typeof body.thumbnailStorageKey === 'string'
      ? { thumbnailStorageKey: body.thumbnailStorageKey as string | null }
      : {}),
    fileName: assertStringField(body, 'fileName'),
    fileSize: assertNumberField(body, 'fileSize'),
    contentType: assertStringField(body, 'contentType'),
    ...(typeof body.provider === 'string' ? { provider: body.provider } : {}),
  };
}

function parseUpdateUploadedVideoBody(body: Record<string, unknown>): UpdateUploadedVideoRequest {
  const patch: UpdateUploadedVideoRequest = {};

  if (body.title !== undefined) patch.title = assertStringField(body, 'title');
  if (body.description !== undefined) patch.description = String(body.description);
  if (body.durationSec !== undefined) patch.durationSec = assertNumberField(body, 'durationSec');
  if (body.difficulty !== undefined) patch.difficulty = assertStringField(body, 'difficulty');
  if (body.bodyParts !== undefined) patch.bodyParts = assertStringArrayField(body, 'bodyParts');
  if (body.tags !== undefined) patch.tags = assertStringArrayField(body, 'tags');
  if (body.isLoopable !== undefined) patch.isLoopable = assertBooleanField(body, 'isLoopable');
  if (body.visibility !== undefined) patch.visibility = assertStringField(body, 'visibility');
  if (body.isPremium !== undefined) patch.isPremium = assertBooleanField(body, 'isPremium');
  if (body.thumbnailStorageKey === null || typeof body.thumbnailStorageKey === 'string') {
    patch.thumbnailStorageKey = body.thumbnailStorageKey as string | null;
  }

  return patch;
}

function parseCreateProgramTemplateBody(
  body: Record<string, unknown>,
): CreateProgramTemplateRequest {
  if (!('templateJson' in body)) {
    throw new ApiError(400, 'INVALID_BODY', 'templateJson is required');
  }

  return {
    ...(typeof body.id === 'string' ? { id: body.id } : {}),
    title: assertStringField(body, 'title'),
    ...(typeof body.description === 'string' ? { description: body.description } : {}),
    ...(typeof body.visibility === 'string' ? { visibility: body.visibility } : {}),
    ...(typeof body.status === 'string' ? { status: body.status } : {}),
    totalDurationSec: assertNumberField(body, 'totalDurationSec'),
    templateJson: body.templateJson,
  };
}

function parseUpdateProgramTemplateBody(
  body: Record<string, unknown>,
): UpdateProgramTemplateRequest {
  const patch: UpdateProgramTemplateRequest = {};

  if (body.title !== undefined) patch.title = assertStringField(body, 'title');
  if (body.description !== undefined) patch.description = String(body.description);
  if (body.visibility !== undefined) patch.visibility = assertStringField(body, 'visibility');
  if (body.status !== undefined) patch.status = assertStringField(body, 'status');
  if (body.totalDurationSec !== undefined) {
    patch.totalDurationSec = assertNumberField(body, 'totalDurationSec');
  }
  if (body.templateJson !== undefined) patch.templateJson = body.templateJson;

  return patch;
}

function parseSubmitPublicTemplateBody(body: Record<string, unknown>): SubmitPublicTemplateRequest {
  const request: SubmitPublicTemplateRequest = {};
  if (typeof body.title === 'string' && body.title.trim()) {
    request.title = body.title.trim();
  }
  if (typeof body.description === 'string') {
    request.description = body.description;
  }
  if (Array.isArray(body.tags) && body.tags.every((item) => typeof item === 'string')) {
    request.tags = body.tags;
  }
  return request;
}

function parseRejectPublicTemplateBody(body: Record<string, unknown>): RejectPublicTemplateRequest {
  return {
    reason: assertStringField(body, 'reason'),
  };
}

router.get('/videos', async (req, res) => {
  try {
    const { gymId } = req.fightboxContext;
    const data = await listUploadedVideos(gymId);
    res.status(200).json({ data });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

router.post(
  '/videos',
  requireAnyPermission(['uploadVideos', 'manageVideos']),
  async (req, res) => {
    try {
      const { gymId, userId } = req.fightboxContext;
      const body = parseCreateUploadedVideoBody(assertObjectBody(req.body));
      const data = await createUploadedVideo({
        ...body,
        gymId,
        createdBy: userId,
      });
      res.status(201).json({ data });
    } catch (error) {
      const { status, body } = toErrorResponse(error);
      res.status(status).json(body);
    }
  },
);

router.patch('/videos/:id', requirePermission('manageVideos'), async (req, res) => {
  try {
    const { gymId } = req.fightboxContext;
    const body = parseUpdateUploadedVideoBody(assertObjectBody(req.body));
    const data = await updateUploadedVideo(routeParam(req.params.id), gymId, body);
    if (!data) {
      throw new ApiError(404, 'NOT_FOUND', 'Uploaded video not found');
    }
    res.status(200).json({ data });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

router.delete('/videos/:id', requirePermission('manageVideos'), async (req, res) => {
  try {
    const { gymId } = req.fightboxContext;
    const result = await deleteUploadedVideoWithMedia(routeParam(req.params.id), gymId);
    if (!result) {
      throw new ApiError(404, 'NOT_FOUND', 'Uploaded video not found');
    }
    res.status(200).json({ data: result });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

router.get('/templates', async (req, res) => {
  try {
    const { gymId } = req.fightboxContext;
    const data = await listProgramTemplates(gymId);
    res.status(200).json({ data });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

router.get('/templates/:id', async (req, res) => {
  try {
    const { gymId } = req.fightboxContext;
    const data = await getProgramTemplate(routeParam(req.params.id), gymId);
    if (!data) {
      throw new ApiError(404, 'NOT_FOUND', 'Program template not found');
    }
    res.status(200).json({ data });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

router.post('/templates', requirePermission('createTemplates'), async (req, res) => {
  try {
    const { gymId, userId } = req.fightboxContext;
    const body = parseCreateProgramTemplateBody(assertObjectBody(req.body));
    const data = await createProgramTemplate({
      ...body,
      gymId,
      createdBy: userId,
    });
    res.status(201).json({ data });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

router.patch('/templates/:id', requirePermission('editTemplates'), async (req, res) => {
  try {
    const { gymId } = req.fightboxContext;
    const body = parseUpdateProgramTemplateBody(assertObjectBody(req.body));
    const data = await updateProgramTemplate(routeParam(req.params.id), gymId, body);
    if (!data) {
      throw new ApiError(404, 'NOT_FOUND', 'Program template not found');
    }
    res.status(200).json({ data });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

router.delete('/templates/:id', requirePermission('deleteTemplates'), async (req, res) => {
  try {
    const { gymId } = req.fightboxContext;
    const deleted = await softDeleteProgramTemplate(routeParam(req.params.id), gymId);
    if (!deleted) {
      throw new ApiError(404, 'NOT_FOUND', 'Program template not found');
    }
    res.status(200).json({ data: { id: req.params.id, deleted: true } });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

router.post(
  '/templates/:id/submit-public',
  requirePermission('submitPublicTemplates'),
  async (req, res) => {
    try {
      const { gymId } = req.fightboxContext;
      const body =
        req.body && typeof req.body === 'object' && !Array.isArray(req.body)
          ? parseSubmitPublicTemplateBody(req.body as Record<string, unknown>)
          : {};
      const data = await submitProgramTemplateForPublic(routeParam(req.params.id), gymId, body);
      if (!data) {
        throw new ApiError(404, 'NOT_FOUND', 'Program template not found');
      }
      res.status(200).json({ data });
    } catch (error) {
      const { status, body } = toErrorResponse(error);
      res.status(status).json(body);
    }
  },
);

router.post(
  '/templates/:id/publish',
  requireAnyPermission(['createTemplates', 'editTemplates']),
  async (req, res) => {
    try {
      const { gymId, userId, role } = req.fightboxContext;
      const templateId = routeParam(req.params.id);
      const { template, creditsCharged } = await publishProgramTemplateWithCredits(
        templateId,
        gymId,
        userId,
        role,
      );
      if (!template.shareToken) {
        throw new ApiError(500, 'SHARE_TOKEN_FAILED', 'Share token was not created');
      }

      res.status(200).json({
        data: {
          template,
          shareToken: template.shareToken,
          shareUrl: buildProgramShareUrl(template.shareToken, req),
          creditsCharged,
        },
      });
    } catch (error) {
      const { status, body } = toErrorResponse(error);
      res.status(status).json(body);
    }
  },
);

router.post(
  '/templates/:id/unpublish',
  requirePermission('editTemplates'),
  async (req, res) => {
    try {
      const { gymId, userId } = req.fightboxContext;
      const templateId = routeParam(req.params.id);
      const template = await unpublishProgramTemplate(templateId, gymId, userId);
      if (!template) {
        throw new ApiError(404, 'NOT_FOUND', 'Program template not found');
      }

      res.status(200).json({ data: { template } });
    } catch (error) {
      const { status, body } = toErrorResponse(error);
      res.status(status).json(body);
    }
  },
);

// super_admin only — replace header trust with JWT/session auth later.
router.get(
  '/admin/public-submissions',
  requirePermission('reviewPublicTemplates'),
  async (_req, res) => {
    try {
      const data = await listPublicPendingSubmissions();
      res.status(200).json({ data });
    } catch (error) {
      const { status, body } = toErrorResponse(error);
      res.status(status).json(body);
    }
  },
);

router.post(
  '/admin/public-submissions/:id/approve',
  requirePermission('reviewPublicTemplates'),
  async (req, res) => {
    try {
      const reviewedBy = req.fightboxContext.userId || DEFAULT_DEMO_ADMIN_ID;
      const data = await approvePublicSubmission(routeParam(req.params.id), reviewedBy);
      if (!data) {
        throw new ApiError(404, 'NOT_FOUND', 'Pending public submission not found');
      }
      res.status(200).json({ data });
    } catch (error) {
      const { status, body } = toErrorResponse(error);
      res.status(status).json(body);
    }
  },
);

router.post(
  '/admin/public-submissions/:id/reject',
  requirePermission('reviewPublicTemplates'),
  async (req, res) => {
    try {
      const reviewedBy = req.fightboxContext.userId || DEFAULT_DEMO_ADMIN_ID;
      const { reason } = parseRejectPublicTemplateBody(assertObjectBody(req.body));
      const data = await rejectPublicSubmission(routeParam(req.params.id), reason, reviewedBy);
      if (!data) {
        throw new ApiError(404, 'NOT_FOUND', 'Pending public submission not found');
      }
      res.status(200).json({ data });
    } catch (error) {
      const { status, body } = toErrorResponse(error);
      res.status(status).json(body);
    }
  },
);

export default router;
