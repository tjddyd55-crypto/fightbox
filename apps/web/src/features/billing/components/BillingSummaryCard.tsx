import type { CreditWalletDto } from '@fightbox/shared';

interface BillingSummaryCardProps {
  wallet: CreditWalletDto | null;
  loading: boolean;
}

export function BillingSummaryCard({ wallet, loading }: BillingSummaryCardProps) {
  return (
    <section className="billing-card billing-summary">
      <h2>현재 크레딧</h2>
      {loading ? (
        <p className="billing-summary-balance billing-summary-balance--loading">불러오는 중…</p>
      ) : (
        <p className="billing-summary-balance">
          {(wallet?.balance ?? 0).toLocaleString('ko-KR')}
          <span className="billing-summary-unit">크레딧</span>
        </p>
      )}
      {wallet ? (
        <dl className="billing-summary-stats">
          <div>
            <dt>누적 구매</dt>
            <dd>{wallet.lifetimePurchased.toLocaleString('ko-KR')}</dd>
          </div>
          <div>
            <dt>누적 지급</dt>
            <dd>{wallet.lifetimeGranted.toLocaleString('ko-KR')}</dd>
          </div>
          <div>
            <dt>누적 사용</dt>
            <dd>{wallet.lifetimeSpent.toLocaleString('ko-KR')}</dd>
          </div>
        </dl>
      ) : null}
    </section>
  );
}
