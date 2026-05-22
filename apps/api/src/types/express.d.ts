import type { FightboxRequestContext } from '@fightbox/shared';

declare global {
  namespace Express {
    interface Request {
      fightboxContext: FightboxRequestContext;
    }
  }
}

export {};
