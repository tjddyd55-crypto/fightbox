import type { PaymentOrderDto } from '@fightbox/shared';

const STATUS_LABELS: Record<PaymentOrderDto['status'], string> = {
  pending: '대기',
  paid: '결제완료',
  failed: '실패',
  cancelled: '취소',
  refunded: '환불',
};

interface PaymentOrderTableProps {
  orders: PaymentOrderDto[];
  loading: boolean;
  completingOrderId: string | null;
  onManualComplete: (orderId: string) => void;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ko-KR');
  } catch {
    return iso;
  }
}

export function PaymentOrderTable({
  orders,
  loading,
  completingOrderId,
  onManualComplete,
}: PaymentOrderTableProps) {
  return (
    <section className="billing-card">
      <h2>결제 내역</h2>
      {loading ? <p className="billing-muted">결제 내역 불러오는 중…</p> : null}
      {!loading && orders.length === 0 ? (
        <p className="billing-muted">결제 내역이 없습니다.</p>
      ) : null}
      {!loading && orders.length > 0 ? (
        <div className="billing-table-wrap">
          <table className="billing-table">
            <thead>
              <tr>
                <th>주문 ID</th>
                <th>상품</th>
                <th>크레딧</th>
                <th>금액</th>
                <th>상태</th>
                <th>생성</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td className="billing-mono">{order.id.slice(0, 16)}…</td>
                  <td>{order.productId}</td>
                  <td>{order.credits.toLocaleString('ko-KR')}</td>
                  <td>
                    {order.amount.toLocaleString('ko-KR')} {order.currency}
                  </td>
                  <td>{STATUS_LABELS[order.status] ?? order.status}</td>
                  <td>{formatDate(order.createdAt)}</td>
                  <td>
                    {order.status === 'pending' && order.orderType === 'subscription_start' ? (
                      <span className="billing-muted">정액제 섹션에서 완료</span>
                    ) : order.status === 'pending' ? (
                      <button
                        type="button"
                        className="billing-btn billing-btn--secondary"
                        disabled={completingOrderId === order.id}
                        onClick={() => onManualComplete(order.id)}
                      >
                        {completingOrderId === order.id ? '처리 중…' : '수동 결제 완료'}
                      </button>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
