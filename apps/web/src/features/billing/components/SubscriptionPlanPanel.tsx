import type { BillingSubscriptionDto, PaymentProductDto } from '@fightbox/shared';

interface SubscriptionPlanPanelProps {
  products: PaymentProductDto[];
  subscriptions: BillingSubscriptionDto[];
  loading: boolean;
  startingProductId: string | null;
  completingSubscriptionId: string | null;
  onStart: (productId: string) => void;
  onManualComplete: (subscriptionId: string) => void;
}

function formatPrice(amount: number, currency: string): string {
  return `${amount.toLocaleString('ko-KR')} ${currency}`;
}

function cycleLabel(cycle: string | null): string {
  return cycle === 'yearly' ? '연간' : '월간';
}

export function SubscriptionPlanPanel({
  products,
  subscriptions,
  loading,
  startingProductId,
  completingSubscriptionId,
  onStart,
  onManualComplete,
}: SubscriptionPlanPanelProps) {
  const subscriptionProducts = products.filter(
    (product) => product.productType === 'subscription_plan' || product.isSubscription,
  );

  const pendingByProductId = new Map<string, BillingSubscriptionDto>();
  for (const subscription of subscriptions) {
    if (subscription.status === 'pending') {
      pendingByProductId.set(subscription.productId, subscription);
    }
  }

  return (
    <section className="billing-card">
      <h2>정액제 플랜</h2>
      {loading ? <p className="billing-muted">플랜 불러오는 중…</p> : null}
      {!loading && subscriptionProducts.length === 0 ? (
        <p className="billing-muted">등록된 정액제 플랜이 없습니다.</p>
      ) : null}
      <ul className="billing-product-list billing-subscription-list">
        {subscriptionProducts.map((product) => {
          const pending = pendingByProductId.get(product.id);
          return (
            <li key={product.id} className="billing-product-item billing-subscription-item">
              <div>
                <h3>{product.name}</h3>
                {product.description ? (
                  <p className="billing-muted">{product.description}</p>
                ) : null}
                <p className="billing-product-meta">
                  {cycleLabel(product.billingCycle)} ·{' '}
                  {formatPrice(product.priceAmount, product.currency)} · 포함{' '}
                  {product.includedCredits.toLocaleString('ko-KR')} 크레딧
                </p>
              </div>
              {pending ? (
                <button
                  type="button"
                  className="billing-btn billing-btn--primary"
                  disabled={completingSubscriptionId === pending.id}
                  onClick={() => onManualComplete(pending.id)}
                >
                  {completingSubscriptionId === pending.id
                    ? '활성화 중…'
                    : '수동 결제 완료'}
                </button>
              ) : (
                <button
                  type="button"
                  className="billing-btn billing-btn--primary"
                  disabled={startingProductId === product.id}
                  onClick={() => onStart(product.id)}
                >
                  {startingProductId === product.id ? '생성 중…' : '시작하기'}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <p className="billing-hint">
        manual provider: 「시작하기」로 pending 구독 생성 후 「수동 결제 완료」로 활성화하면 포함
        크레딧이 지갑에 지급됩니다. 실제 PG 정기결제는 2차에서 연동됩니다.
      </p>
    </section>
  );
}
