import { Router } from 'express';
import { requireAnyPermission, requirePermission } from '../middleware/permissions.js';
import {
  completeManualPaymentOrder,
  createPaymentOrderForProduct,
  getMyWallet,
  listActiveProducts,
  listMyLedger,
  listMyPaymentOrders,
} from '../services/billingService.js';
import { ApiError, toErrorResponse } from '../utils/apiError.js';
import { parseCreatePaymentOrderBody } from '../utils/billingValidation.js';

const router = Router();

function routeParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

router.get('/wallet', requirePermission('viewBilling'), async (req, res) => {
  try {
    const data = await getMyWallet(req.fightboxContext);
    res.status(200).json({ data });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

router.get('/ledger', requirePermission('viewBilling'), async (req, res) => {
  try {
    const data = await listMyLedger(req.fightboxContext);
    res.status(200).json({ data });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

router.get('/products', requireAnyPermission(['viewBilling', 'purchaseCredits']), async (req, res) => {
  try {
    const data = await listActiveProducts();
    res.status(200).json({ data });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

router.get('/orders', requirePermission('viewBilling'), async (req, res) => {
  try {
    const data = await listMyPaymentOrders(req.fightboxContext);
    res.status(200).json({ data });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

router.post('/orders', requirePermission('purchaseCredits'), async (req, res) => {
  try {
    const { productId } = parseCreatePaymentOrderBody(req.body);
    const data = await createPaymentOrderForProduct(req.fightboxContext, productId);
    res.status(201).json({ data });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

router.post('/orders/:orderId/manual-complete', requirePermission('purchaseCredits'), async (req, res) => {
  try {
    const orderId = routeParam(req.params.orderId).trim();
    if (!orderId) {
      throw new ApiError(400, 'INVALID_ORDER_ID', 'orderId is required');
    }

    const data = await completeManualPaymentOrder(req.fightboxContext, orderId);
    res.status(200).json({ data });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

export default router;
