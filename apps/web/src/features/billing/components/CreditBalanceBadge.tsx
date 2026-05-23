import { useCreditWallet } from '../hooks/useCreditWallet';
import type { FightboxSessionUser } from '@fightbox/shared';

interface CreditBalanceBadgeProps {
  user: FightboxSessionUser;
  className?: string;
}

export function CreditBalanceBadge({ user, className }: CreditBalanceBadgeProps) {
  const { balance, loading, error } = useCreditWallet(user);

  let label = '-- 크레딧';
  if (loading) {
    label = '불러오는 중…';
  } else if (error) {
    label = '-- 크레딧';
  } else if (balance !== null) {
    label = `${balance.toLocaleString('ko-KR')} 크레딧`;
  }

  return (
    <span
      className={className ?? 'billing-credit-badge'}
      title="체육관 보유 크레딧"
    >
      {label}
    </span>
  );
}
