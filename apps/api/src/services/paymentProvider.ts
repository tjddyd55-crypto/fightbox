export interface CreateCheckoutInput {
  orderId: string;
  productName: string;
  amount: number;
  currency: string;
  credits: number;
  successUrl: string;
  failUrl: string;
}

export interface CreateCheckoutResult {
  provider: string;
  providerOrderId: string;
  checkoutUrl: string | null;
}

export interface PaymentProvider {
  createCheckout(input: CreateCheckoutInput): Promise<CreateCheckoutResult>;
}
