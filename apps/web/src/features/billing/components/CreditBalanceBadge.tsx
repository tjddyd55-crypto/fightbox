import { useCreditWallet } from '../hooks/useCreditWallet';
import { CREDITS_CHANGED_EVENT } from '../creditsEvents';
import type { FightboxSessionUser } from '@fightbox/shared';
import { useEffect } from 'react';

interface CreditBalanceBadgeProps {
  user: FightboxSessionUser;
  className?: string;
}

export function CreditBalanceBadge({ user, className }: CreditBalanceBadgeProps) {
  const { balance, loading, error, refresh } = useCreditWallet(user);

  useEffect(() => {
    const onCreditsChanged = () => {
      refresh();
    };
    window.addEventListener(CREDITS_CHANGED_EVENT, onCreditsChanged);
    return () => window.removeEventListener(CREDITS_CHANGED_EVENT, onCreditsChanged);
  }, [refresh]);

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
