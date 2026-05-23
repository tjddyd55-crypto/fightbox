import { Router } from 'express';
import { requirePermission } from '../middleware/permissions.js';
import { adjustCreditsByAdmin, listAllWallets } from '../services/billingService.js';
import { toErrorResponse } from '../utils/apiError.js';
import { parseManualCreditAdjustmentBody } from '../utils/billingValidation.js';

const router = Router();

router.get('/wallets', requirePermission('manageBilling'), async (req, res) => {
  try {
    const data = await listAllWallets(req.fightboxContext);
    res.status(200).json({ data });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

router.post('/credits/adjust', requirePermission('manageBilling'), async (req, res) => {
  try {
    const input = parseManualCreditAdjustmentBody(req.body);
    const data = await adjustCreditsByAdmin(req.fightboxContext, input);
    res.status(200).json({ data });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

export default router;
