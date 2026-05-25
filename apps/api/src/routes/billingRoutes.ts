import { Router } from 'express';
import { requireAnyPermission, requirePermission } from '../middleware/permissions.js';
import {
  cancelSubscription,
  completeManualPaymentOrder,
  completeManualSubscription,
  createPaymentOrderForProduct,
  createSubscriptionOrder,
  getBillingSummary,
  getMyActiveSubscription,
  getMyWallet,
  listActiveProducts,
  listMyLedger,
  listMyPaymentOrders,
  listMySubscriptions,
} from '../services/billingService.js';
import { ApiError, toErrorResponse } from '../utils/apiError.js';
import {
  parseCreatePaymentOrderBody,
  parseCreateSubscriptionBody,
} from '../utils/billingValidation.js';

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

router.get('/summary', requirePermission('viewBilling'), async (req, res) => {
  try {
    const data = await getBillingSummary(req.fightboxContext);
    res.status(200).json({ data });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

router.get('/subscriptions', requirePermission('viewBilling'), async (req, res) => {
  try {
    const data = await listMySubscriptions(req.fightboxContext);
    res.status(200).json({ data });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

router.get('/subscriptions/active', requirePermission('viewBilling'), async (req, res) => {
  try {
    const data = await getMyActiveSubscription(req.fightboxContext);
    res.status(200).json({ data });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

router.post('/subscriptions', requirePermission('purchaseCredits'), async (req, res) => {
  try {
    const { productId } = parseCreateSubscriptionBody(req.body);
    const data = await createSubscriptionOrder(req.fightboxContext, productId);
    res.status(201).json({ data });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

router.post('/subscriptions/:subscriptionId/manual-complete', requirePermission('purchaseCredits'), async (req, res) => {
  try {
    const subscriptionId = routeParam(req.params.subscriptionId).trim();
    if (!subscriptionId) {
      throw new ApiError(400, 'INVALID_SUBSCRIPTION_ID', 'subscriptionId is required');
    }

    const data = await completeManualSubscription(req.fightboxContext, subscriptionId);
    res.status(200).json({ data });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

router.post('/subscriptions/:subscriptionId/cancel', requirePermission('purchaseCredits'), async (req, res) => {
  try {
    const subscriptionId = routeParam(req.params.subscriptionId).trim();
    if (!subscriptionId) {
      throw new ApiError(400, 'INVALID_SUBSCRIPTION_ID', 'subscriptionId is required');
    }

    const data = await cancelSubscription(req.fightboxContext, subscriptionId);
    res.status(200).json({ data });
  } catch (error) {
    const { status, body } = toErrorResponse(error);
    res.status(status).json(body);
  }
});

export default router;
