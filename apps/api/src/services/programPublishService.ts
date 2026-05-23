import type { FightboxUserRole, ProgramTemplateDto } from '@fightbox/shared';
import { CREDIT_USAGE_COSTS } from '@fightbox/shared';
import { getDatabasePool } from '../config/database.js';
import { spendCreditsForProgramPublish } from './billingService.js';
import {
  generateUniqueShareTokenWithClient,
  lockProgramTemplateForUpdate,
  updateProgramTemplatePublishState,
} from '../repositories/programTemplateRepository.js';
import { ApiError } from '../utils/apiError.js';

export interface PublishProgramTemplateResult {
  template: ProgramTemplateDto;
  creditsCharged: number;
}

function wrapDatabaseError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  if (error instanceof Error) {
    return new ApiError(500, 'DATABASE_ERROR', error.message);
  }
  return new ApiError(500, 'DATABASE_ERROR', 'Unexpected database error');
}

export async function publishProgramTemplateWithCredits(
  templateId: string,
  gymId: string,
  actorId: string,
  role: FightboxUserRole,
): Promise<PublishProgramTemplateResult> {
  const pool = getDatabasePool();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const locked = await lockProgramTemplateForUpdate(client, templateId, gymId);
    if (!locked) {
      throw new ApiError(404, 'NOT_FOUND', 'Program template not found');
    }

    const alreadyCharged = locked.published_at !== null;
    const skipCharge = role === 'super_admin';
    let creditsCharged = 0;

    if (!alreadyCharged && !skipCharge) {
      await spendCreditsForProgramPublish(gymId, templateId, actorId, client);
      creditsCharged = CREDIT_USAGE_COSTS.programPublish;
    }

    const shareToken =
      locked.share_token?.trim() || (await generateUniqueShareTokenWithClient(client));

    const template = await updateProgramTemplatePublishState(
      client,
      templateId,
      gymId,
      shareToken,
    );

    if (!template) {
      throw new ApiError(404, 'NOT_FOUND', 'Program template not found');
    }

    await client.query('COMMIT');
    return { template, creditsCharged };
  } catch (error) {
    await client.query('ROLLBACK');
    throw wrapDatabaseError(error);
  } finally {
    client.release();
  }
}
