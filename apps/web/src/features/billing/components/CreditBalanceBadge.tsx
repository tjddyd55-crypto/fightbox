import { useCreditWallet } from '../hooks/useCreditWallet';
import { CREDITS_CHANGED_EVENT } from '../creditsEvents';
import { getActiveSubscription } from '../billingApiClient';
import type { FightboxSessionUser } from '@fightbox/shared';
import { canViewBilling, sessionUserToRequestContext } from '@fightbox/shared';
import { useEffect, useState } from 'react';

interface CreditBalanceBadgeProps {
  user: FightboxSessionUser;
  className?: string;
}

export function CreditBalanceBadge({ user, className }: CreditBalanceBadgeProps) {
  const { balance, loading, error, refresh } = useCreditWallet(user);
  const [subscriptionCycle, setSubscriptionCycle] = useState<string | null>(null);

  useEffect(() => {
    const onCreditsChanged = () => {
      refresh();
    };
    window.addEventListener(CREDITS_CHANGED_EVENT, onCreditsChanged);
    return () => window.removeEventListener(CREDITS_CHANGED_EVENT, onCreditsChanged);
  }, [refresh]);

  useEffect(() => {
    const context = sessionUserToRequestContext(user);
    if (!canViewBilling(context)) {
      setSubscriptionCycle(null);
      return;
    }

    getActiveSubscription(user)
      .then((subscription) => {
        if (!subscription) {
          setSubscriptionCycle(null);
          return;
        }
        setSubscriptionCycle(subscription.billingCycle === 'yearly' ? '연간' : '월정액');
      })
      .catch(() => {
        setSubscriptionCycle(null);
      });
  }, [user, balance]);

  let label = '-- 크레딧';
  if (loading) {
    label = '불러오는 중…';
  } else if (error) {
    label = '-- 크레딧';
  } else if (balance !== null) {
    label = subscriptionCycle
      ? `${balance.toLocaleString('ko-KR')} 크레딧 · ${subscriptionCycle}`
      : `${balance.toLocaleString('ko-KR')} 크레딧`;
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
