import type { FightboxRequestContext, FightboxJwtPayload } from '@fightbox/shared';

declare global {
  namespace Express {
    interface Request {
      fightboxContext: FightboxRequestContext;
      jwtPayload?: FightboxJwtPayload;
    }
  }
}

export {};
