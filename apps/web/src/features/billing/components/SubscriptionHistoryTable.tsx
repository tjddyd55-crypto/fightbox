import type { BillingSubscriptionDto, PaymentProductDto } from '@fightbox/shared';

const STATUS_LABELS: Record<BillingSubscriptionDto['status'], string> = {
  pending: '대기',
  active: '활성',
  past_due: '연체',
  cancelled: '취소됨',
  expired: '만료',
};

interface SubscriptionHistoryTableProps {
  subscriptions: BillingSubscriptionDto[];
  products: PaymentProductDto[];
  loading: boolean;
}

function resolveProductName(productId: string, products: PaymentProductDto[]): string {
  return products.find((product) => product.id === productId)?.name ?? productId;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ko-KR');
  } catch {
    return iso;
  }
}

export function SubscriptionHistoryTable({
  subscriptions,
  products,
  loading,
}: SubscriptionHistoryTableProps) {
  return (
    <section className="billing-card">
      <h2>구독 내역</h2>
      {loading ? <p className="billing-muted">구독 내역 불러오는 중…</p> : null}
      {!loading && subscriptions.length === 0 ? (
        <p className="billing-muted">구독 내역이 없습니다.</p>
      ) : null}
      {!loading && subscriptions.length > 0 ? (
        <div className="billing-table-wrap">
          <table className="billing-table">
            <thead>
              <tr>
                <th>플랜</th>
                <th>상태</th>
                <th>주기</th>
                <th>포함 크레딧</th>
                <th>기간 종료</th>
                <th>취소 예정</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((subscription) => (
                <tr key={subscription.id}>
                  <td>{resolveProductName(subscription.productId, products)}</td>
                  <td>{STATUS_LABELS[subscription.status] ?? subscription.status}</td>
                  <td>{subscription.billingCycle === 'yearly' ? '연간' : '월간'}</td>
                  <td>{subscription.includedCreditsPerPeriod.toLocaleString('ko-KR')}</td>
                  <td>{formatDate(subscription.currentPeriodEnd)}</td>
                  <td>{subscription.cancelAtPeriodEnd ? '예' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
