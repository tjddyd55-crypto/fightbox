import type { CreditLedgerEntryDto } from '@fightbox/shared';

const ENTRY_TYPE_LABELS: Record<CreditLedgerEntryDto['entryType'], string> = {
  purchase: '구매',
  grant: '지급',
  spend: '사용',
  refund: '환불',
  adjustment: '조정',
  revoke: '회수',
};

interface CreditLedgerTableProps {
  entries: CreditLedgerEntryDto[];
  loading: boolean;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ko-KR');
  } catch {
    return iso;
  }
}

export function CreditLedgerTable({ entries, loading }: CreditLedgerTableProps) {
  return (
    <section className="billing-card">
      <h2>크레딧 원장</h2>
      {loading ? <p className="billing-muted">원장 불러오는 중…</p> : null}
      {!loading && entries.length === 0 ? (
        <p className="billing-muted">원장 내역이 없습니다.</p>
      ) : null}
      {!loading && entries.length > 0 ? (
        <div className="billing-table-wrap">
          <table className="billing-table">
            <thead>
              <tr>
                <th>일시</th>
                <th>유형</th>
                <th>변동</th>
                <th>잔액</th>
                <th>사유</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td>{formatDate(entry.createdAt)}</td>
                  <td>{ENTRY_TYPE_LABELS[entry.entryType] ?? entry.entryType}</td>
                  <td className={entry.amount >= 0 ? 'billing-amount-plus' : 'billing-amount-minus'}>
                    {entry.amount >= 0 ? '+' : ''}
                    {entry.amount.toLocaleString('ko-KR')}
                  </td>
                  <td>{entry.balanceAfter.toLocaleString('ko-KR')}</td>
                  <td>{entry.reason || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
