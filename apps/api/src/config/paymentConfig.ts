export interface PaymentConfig {
  provider: string;
  frontendPublicUrl: string;
  portoneStoreId?: string;
  portoneChannelKey?: string;
  portoneApiSecret?: string;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
}

export function getPaymentConfig(): PaymentConfig {
  const frontendPublicUrl =
    process.env.FRONTEND_PUBLIC_URL?.trim() ||
    process.env.FRONTEND_ORIGIN?.trim() ||
    'http://localhost:5173';

  return {
    provider: process.env.PAYMENT_PROVIDER?.trim() || 'manual',
    frontendPublicUrl,
    portoneStoreId: process.env.PORTONE_STORE_ID?.trim(),
    portoneChannelKey: process.env.PORTONE_CHANNEL_KEY?.trim(),
    portoneApiSecret: process.env.PORTONE_API_SECRET?.trim(),
    stripeSecretKey: process.env.STRIPE_SECRET_KEY?.trim(),
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET?.trim(),
  };
}

export function isManualPaymentProvider(): boolean {
  return getPaymentConfig().provider === 'manual';
}
