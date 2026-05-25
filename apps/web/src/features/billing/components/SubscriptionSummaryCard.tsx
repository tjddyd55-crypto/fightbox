import type { BillingSubscriptionDto, PaymentProductDto } from '@fightbox/shared';

interface SubscriptionSummaryCardProps {
  activeSubscription: BillingSubscriptionDto | null;
  products: PaymentProductDto[];
  loading: boolean;
  onCancel?: (subscriptionId: string) => void;
  cancellingSubscriptionId?: string | null;
}

function resolveProductName(
  productId: string,
  products: PaymentProductDto[],
): string {
  return products.find((product) => product.id === productId)?.name ?? productId;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('ko-KR');
  } catch {
    return iso;
  }
}

export function SubscriptionSummaryCard({
  activeSubscription,
  products,
  loading,
  onCancel,
  cancellingSubscriptionId,
}: SubscriptionSummaryCardProps) {
  return (
    <section className="billing-card billing-subscription-summary">
      <h2>구독 상태</h2>
      {loading ? <p className="billing-muted">불러오는 중…</p> : null}
      {!loading && !activeSubscription ? (
        <p className="billing-muted">활성 구독이 없습니다. 아래 정액제 플랜에서 시작할 수 있습니다.</p>
      ) : null}
      {!loading && activeSubscription ? (
        <div className="billing-subscription-active">
          <p className="billing-subscription-plan">
            {resolveProductName(activeSubscription.productId, products)}
            <span className="billing-subscription-status">active</span>
          </p>
          <dl className="billing-subscription-meta">
            <div>
              <dt>결제 주기</dt>
              <dd>{activeSubscription.billingCycle === 'yearly' ? '연간' : '월간'}</dd>
            </div>
            <div>
              <dt>포함 크레딧</dt>
              <dd>{activeSubscription.includedCreditsPerPeriod.toLocaleString('ko-KR')}</dd>
            </div>
            <div>
              <dt>현재 기간 종료</dt>
              <dd>{formatDate(activeSubscription.currentPeriodEnd)}</dd>
            </div>
          </dl>
          {activeSubscription.cancelAtPeriodEnd ? (
            <p className="billing-subscription-cancel-notice">
              기간 종료 시 취소 예정 ({formatDate(activeSubscription.currentPeriodEnd)})
            </p>
          ) : onCancel ? (
            <button
              type="button"
              className="billing-btn"
              disabled={cancellingSubscriptionId === activeSubscription.id}
              onClick={() => onCancel(activeSubscription.id)}
            >
              {cancellingSubscriptionId === activeSubscription.id
                ? '처리 중…'
                : '기간 종료 시 취소'}
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
