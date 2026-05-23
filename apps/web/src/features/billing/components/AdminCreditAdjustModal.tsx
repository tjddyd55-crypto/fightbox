import { useState, type FormEvent } from 'react';
import type { CreditWalletDto } from '@fightbox/shared';

interface AdminCreditAdjustModalProps {
  isOpen: boolean;
  wallets: CreditWalletDto[];
  onClose: () => void;
  onSubmit: (input: { gymId: string; amount: number; reason: string }) => Promise<void>;
}

export function AdminCreditAdjustModal({
  isOpen,
  wallets,
  onClose,
  onSubmit,
}: AdminCreditAdjustModalProps) {
  const [gymId, setGymId] = useState(wallets[0]?.gymId ?? 'demo-gym');
  const [amount, setAmount] = useState('50');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    const parsedAmount = Number.parseInt(amount, 10);
    if (!Number.isInteger(parsedAmount) || parsedAmount === 0) {
      setErrorMessage('amount는 0이 아닌 정수여야 합니다.');
      return;
    }
    if (!reason.trim()) {
      setErrorMessage('사유를 입력해 주세요.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ gymId, amount: parsedAmount, reason: reason.trim() });
      setReason('');
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '조정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="billing-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="billing-modal"
        role="dialog"
        aria-labelledby="admin-credit-adjust-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="admin-credit-adjust-title">크레딧 수동 지급/차감</h2>
        <form className="billing-form" onSubmit={handleSubmit}>
          <label>
            체육관 (gymId)
            <select value={gymId} onChange={(event) => setGymId(event.target.value)}>
              {wallets.map((wallet) => (
                <option key={wallet.gymId} value={wallet.gymId}>
                  {wallet.gymId} (잔액 {wallet.balance})
                </option>
              ))}
            </select>
          </label>
          <label>
            변동량 (양수=지급, 음수=차감)
            <input
              type="number"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
            />
          </label>
          <label>
            사유
            <input
              type="text"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              required
            />
          </label>
          {errorMessage ? <p className="billing-error">{errorMessage}</p> : null}
          <div className="billing-modal-actions">
            <button type="button" className="billing-btn" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="billing-btn billing-btn--primary" disabled={submitting}>
              {submitting ? '처리 중…' : '적용'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
