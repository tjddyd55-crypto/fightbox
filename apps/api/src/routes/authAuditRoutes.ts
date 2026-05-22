import { Router } from 'express';
import { requirePermission } from '../middleware/permissions.js';
import { listAuthAuditLogs } from '../repositories/authAuditLogRepository.js';
import { toErrorResponse } from '../utils/apiError.js';
import { parseListAuthAuditLogsQuery } from '../utils/authAuditValidation.js';

const router = Router();

router.get('/', requirePermission('viewAuthAuditLogs'), async (req, res) => {
  try {
    const filters = parseListAuthAuditLogsQuery(req.query as Record<string, unknown>);
    const data = await listAuthAuditLogs(filters);
    res.status(200).json({ data });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

export default router;
