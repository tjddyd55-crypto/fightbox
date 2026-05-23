import { getPaymentConfig } from '../config/paymentConfig.js';
import type {
  CreateCheckoutInput,
  CreateCheckoutResult,
  PaymentProvider,
} from './paymentProvider.js';

export class ManualPaymentProvider implements PaymentProvider {
  async createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult> {
    const { frontendPublicUrl } = getPaymentConfig();
    const checkoutUrl = `${frontendPublicUrl}/dashboard/billing?orderId=${encodeURIComponent(input.orderId)}&manual=1`;

    return {
      provider: 'manual',
      providerOrderId: input.orderId,
      checkoutUrl,
    };
  }
}

export function getPaymentProvider(): PaymentProvider {
  const { provider } = getPaymentConfig();

  switch (provider) {
    case 'manual':
      return new ManualPaymentProvider();
    default:
      throw new Error(`Unsupported payment provider: ${provider}`);
  }
}
