import type { PaymentProductDto } from '@fightbox/shared';

interface CreditPurchasePanelProps {
  products: PaymentProductDto[];
  loading: boolean;
  purchasingProductId: string | null;
  onPurchase: (productId: string) => void;
}

export function CreditPurchasePanel({
  products,
  loading,
  purchasingProductId,
  onPurchase,
}: CreditPurchasePanelProps) {
  const creditProducts = products.filter(
    (product) => product.productType === 'credit_pack' || !product.isSubscription,
  );

  return (
    <section className="billing-card">
      <h2>크레딧 충전 상품</h2>
      {loading ? <p className="billing-muted">상품 불러오는 중…</p> : null}
      {!loading && creditProducts.length === 0 ? (
        <p className="billing-muted">등록된 충전 상품이 없습니다.</p>
      ) : null}
      <ul className="billing-product-list">
        {creditProducts.map((product) => (
          <li key={product.id} className="billing-product-item">
            <div>
              <h3>{product.name}</h3>
              {product.description ? (
                <p className="billing-muted">{product.description}</p>
              ) : null}
              <p className="billing-product-meta">
                {product.credits.toLocaleString('ko-KR')} 크레딧 ·{' '}
                {product.priceAmount.toLocaleString('ko-KR')} {product.currency}
              </p>
            </div>
            <button
              type="button"
              className="billing-btn billing-btn--primary"
              disabled={purchasingProductId === product.id}
              onClick={() => onPurchase(product.id)}
            >
              {purchasingProductId === product.id ? '주문 생성 중…' : '충전 요청'}
            </button>
          </li>
        ))}
      </ul>
      <p className="billing-hint">
        manual provider 테스트: 주문 생성 후 아래 결제 내역에서 「수동 결제 완료」를 누르면 크레딧이
        충전됩니다. 실제 PG 결제창 연동은 2차에서 추가됩니다.
      </p>
    </section>
  );
}
