import type { BillingCycle } from '@fightbox/shared';

export function computePeriodEnd(start: Date, billingCycle: BillingCycle): Date {
  const end = new Date(start);
  if (billingCycle === 'monthly') {
    end.setMonth(end.getMonth() + 1);
  } else {
    end.setFullYear(end.getFullYear() + 1);
  }
  return end;
}
