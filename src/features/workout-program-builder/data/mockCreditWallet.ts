import type { CreditWallet } from '../types/creditsAndPermissions.types';

export const mockCreditWallet: CreditWallet = {
  balance: 120,
  currencyLabel: '크레딧',
  updatedAt: new Date().toISOString(),
};
