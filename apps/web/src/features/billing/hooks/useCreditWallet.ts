import { useCallback, useEffect, useState } from 'react';
import type { FightboxSessionUser } from '@fightbox/shared';
import { canViewBilling } from '@fightbox/shared';
import { sessionUserToRequestContext } from '@fightbox/shared';
import { getMyWallet } from '../billingApiClient';

interface UseCreditWalletResult {
  balance: number | null;
  loading: boolean;
  error: boolean;
  refresh: () => void;
}

export function useCreditWallet(user: FightboxSessionUser | null): UseCreditWalletResult {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const refresh = useCallback(() => {
    if (!user) {
      setBalance(null);
      setError(false);
      return;
    }

    const context = sessionUserToRequestContext(user);
    if (!canViewBilling(context)) {
      setBalance(null);
      setError(false);
      return;
    }

    setLoading(true);
    setError(false);
    getMyWallet(user)
      .then((wallet) => {
        setBalance(wallet.balance);
      })
      .catch(() => {
        setBalance(null);
        setError(true);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { balance, loading, error, refresh };
}
