import { randomBytes, randomUUID } from 'node:crypto';
import type {
  CreateProgramTemplateRequest,
  ProgramTemplateDto,
  SubmitPublicTemplateRequest,
  UpdateProgramTemplateRequest,
} from '@fightbox/shared';
import { getDatabasePool } from '../config/database.js';
import { DEFAULT_DEMO_ADMIN_ID } from '../constants/workoutBuilderConstants.js';
import { ApiError } from '../utils/apiError.js';

interface ProgramTemplateRow {
  id: string;
  gym_id: string;
  title: string;
  description: string;
  visibility: string;
  status: string;
  total_duration_sec: number;
  template_json: unknown;
  public_review_status: string | null;
  public_rejection_reason: string | null;
  public_reviewed_at: Date | null;
  public_reviewed_by: string | null;
  published_at: Date | null;
  unpublished_at: Date | null;
  share_token: string | null;
  share_enabled: boolean;
  share_created_at: Date | null;
  share_updated_at: Date | null;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProgramTemplateRecord extends CreateProgramTemplateRequest {
  gymId: string;
  createdBy: string;
}

function mapProgramTemplateRow(row: ProgramTemplateRow): ProgramTemplateDto {
  return {
    id: row.id,
    gymId: row.gym_id,
    title: row.title,
    description: row.description,
    visibility: row.visibility,
    status: row.status,
    totalDurationSec: row.total_duration_sec,
    templateJson: row.template_json,
    publicReviewStatus: row.public_review_status,
    publicRejectionReason: row.public_rejection_reason,
    publicReviewedAt: row.public_reviewed_at?.toISOString() ?? null,
    publicReviewedBy: row.public_reviewed_by,
    shareToken: row.share_token,
    shareEnabled: row.share_enabled,
    publishedAt: row.published_at?.toISOString() ?? null,
    unpublishedAt: row.unpublished_at?.toISOString() ?? null,
    createdBy: row.created_by,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
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

function mergeTemplateJsonVisibility(
  templateJson: unknown,
  visibility: string,
  patch?: SubmitPublicTemplateRequest,
): Record<string, unknown> {
  const base =
    templateJson && typeof templateJson === 'object' && !Array.isArray(templateJson)
      ? { ...(templateJson as Record<string, unknown>) }
      : {};

  base.visibility = visibility;
  if (patch?.title !== undefined) base.title = patch.title;
  if (patch?.description !== undefined) base.description = patch.description;
  if (patch?.tags !== undefined) base.tags = patch.tags;

  return base;
}

export async function listProgramTemplates(gymId: string): Promise<ProgramTemplateDto[]> {
  try {
    const pool = getDatabasePool();
    const result = await pool.query<ProgramTemplateRow>(
      `
        SELECT *
        FROM program_templates
        WHERE gym_id = $1 AND deleted_at IS NULL
        ORDER BY updated_at DESC
      `,
      [gymId],
    );
    return result.rows.map(mapProgramTemplateRow);
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function listPublicPendingSubmissions(): Promise<ProgramTemplateDto[]> {
  try {
    const pool = getDatabasePool();
    const result = await pool.query<ProgramTemplateRow>(
      `
        SELECT *
        FROM program_templates
        WHERE visibility = 'public_pending' AND deleted_at IS NULL
        ORDER BY updated_at DESC
      `,
    );
    return result.rows.map(mapProgramTemplateRow);
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function getProgramTemplate(
  id: string,
  gymId: string,
): Promise<ProgramTemplateDto | null> {
  try {
    const pool = getDatabasePool();
    const result = await pool.query<ProgramTemplateRow>(
      `
        SELECT *
        FROM program_templates
        WHERE id = $1 AND gym_id = $2 AND deleted_at IS NULL
      `,
      [id, gymId],
    );
    const row = result.rows[0];
    return row ? mapProgramTemplateRow(row) : null;
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

async function getProgramTemplateById(id: string): Promise<ProgramTemplateRow | null> {
  const pool = getDatabasePool();
  const result = await pool.query<ProgramTemplateRow>(
    `
      SELECT *
      FROM program_templates
      WHERE id = $1 AND deleted_at IS NULL
    `,
    [id],
  );
  return result.rows[0] ?? null;
}

export async function createProgramTemplate(
  input: CreateProgramTemplateRecord,
): Promise<ProgramTemplateDto> {
  const id = input.id?.trim() || `template_${randomUUID()}`;

  try {
    const pool = getDatabasePool();
    const result = await pool.query<ProgramTemplateRow>(
      `
        INSERT INTO program_templates (
          id,
          gym_id,
          title,
          description,
          visibility,
          status,
          total_duration_sec,
          template_json,
          created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
        ON CONFLICT (id) DO UPDATE SET
          gym_id = EXCLUDED.gym_id,
          title = EXCLUDED.title,
          description = EXCLUDED.description,
          visibility = EXCLUDED.visibility,
          status = EXCLUDED.status,
          total_duration_sec = EXCLUDED.total_duration_sec,
          template_json = EXCLUDED.template_json,
          created_by = EXCLUDED.created_by,
          updated_at = now(),
          deleted_at = NULL
        RETURNING *
      `,
      [
        id,
        input.gymId,
        input.title.trim(),
        input.description?.trim() ?? '',
        input.visibility ?? 'private',
        input.status ?? 'draft',
        input.totalDurationSec,
        JSON.stringify(input.templateJson),
        input.createdBy,
      ],
    );

    const row = result.rows[0];
    if (!row) {
      throw new ApiError(500, 'DATABASE_ERROR', 'Failed to create program template');
    }
    return mapProgramTemplateRow(row);
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function updateProgramTemplate(
  id: string,
  gymId: string,
  input: UpdateProgramTemplateRequest,
): Promise<ProgramTemplateDto | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let index = 1;

  const assign = (column: string, value: unknown): void => {
    fields.push(`${column} = $${index}`);
    values.push(value);
    index += 1;
  };

  if (input.title !== undefined) assign('title', input.title.trim());
  if (input.description !== undefined) assign('description', input.description.trim());
  if (input.visibility !== undefined) assign('visibility', input.visibility);
  if (input.status !== undefined) assign('status', input.status);
  if (input.totalDurationSec !== undefined) assign('total_duration_sec', input.totalDurationSec);
  if (input.templateJson !== undefined) assign('template_json', JSON.stringify(input.templateJson));

  if (fields.length === 0) {
    throw new ApiError(400, 'INVALID_BODY', 'No updatable fields provided');
  }

  assign('updated_at', new Date());
  values.push(id, gymId);

  try {
    const pool = getDatabasePool();
    const result = await pool.query<ProgramTemplateRow>(
      `
        UPDATE program_templates
        SET ${fields.join(', ')}
        WHERE id = $${index} AND gym_id = $${index + 1} AND deleted_at IS NULL
        RETURNING *
      `,
      values,
    );

    const row = result.rows[0];
    return row ? mapProgramTemplateRow(row) : null;
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function submitProgramTemplateForPublic(
  id: string,
  gymId: string,
  input: SubmitPublicTemplateRequest = {},
): Promise<ProgramTemplateDto | null> {
  const existing = await getProgramTemplate(id, gymId);
  if (!existing) {
    return null;
  }

  if (existing.visibility === 'public_pending') {
    throw new ApiError(409, 'ALREADY_PENDING', 'Template is already pending public review');
  }

  const title = input.title?.trim() || existing.title;
  const description =
    input.description !== undefined ? input.description.trim() : existing.description;
  const tags = input.tags ?? extractTagsFromTemplateJson(existing.templateJson);
  const templateJson = mergeTemplateJsonVisibility(existing.templateJson, 'public_pending', {
    title,
    description,
    tags,
  });

  try {
    const pool = getDatabasePool();
    const result = await pool.query<ProgramTemplateRow>(
      `
        UPDATE program_templates
        SET
          title = $1,
          description = $2,
          visibility = 'public_pending',
          public_review_status = 'pending',
          public_rejection_reason = NULL,
          public_reviewed_at = NULL,
          public_reviewed_by = NULL,
          template_json = $3::jsonb,
          updated_at = now()
        WHERE id = $4 AND gym_id = $5 AND deleted_at IS NULL
        RETURNING *
      `,
      [title, description, JSON.stringify(templateJson), id, gymId],
    );

    const row = result.rows[0];
    return row ? mapProgramTemplateRow(row) : null;
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function approvePublicSubmission(
  id: string,
  reviewedBy: string = DEFAULT_DEMO_ADMIN_ID,
): Promise<ProgramTemplateDto | null> {
  const existing = await getProgramTemplateById(id);
  if (!existing || existing.visibility !== 'public_pending') {
    return null;
  }

  const templateJson = mergeTemplateJsonVisibility(existing.template_json, 'public');

  try {
    const pool = getDatabasePool();
    const result = await pool.query<ProgramTemplateRow>(
      `
        UPDATE program_templates
        SET
          visibility = 'public',
          status = 'active',
          public_review_status = 'approved',
          public_rejection_reason = NULL,
          public_reviewed_at = now(),
          public_reviewed_by = $1,
          template_json = $2::jsonb,
          updated_at = now()
        WHERE id = $3 AND visibility = 'public_pending' AND deleted_at IS NULL
        RETURNING *
      `,
      [reviewedBy, JSON.stringify(templateJson), id],
    );

    const row = result.rows[0];
    return row ? mapProgramTemplateRow(row) : null;
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function rejectPublicSubmission(
  id: string,
  reason: string,
  reviewedBy: string = DEFAULT_DEMO_ADMIN_ID,
): Promise<ProgramTemplateDto | null> {
  const existing = await getProgramTemplateById(id);
  if (!existing || existing.visibility !== 'public_pending') {
    return null;
  }

  const templateJson = mergeTemplateJsonVisibility(existing.template_json, 'public_rejected');

  try {
    const pool = getDatabasePool();
    const result = await pool.query<ProgramTemplateRow>(
      `
        UPDATE program_templates
        SET
          visibility = 'public_rejected',
          status = 'active',
          public_review_status = 'rejected',
          public_rejection_reason = $1,
          public_reviewed_at = now(),
          public_reviewed_by = $2,
          template_json = $3::jsonb,
          updated_at = now()
        WHERE id = $4 AND visibility = 'public_pending' AND deleted_at IS NULL
        RETURNING *
      `,
      [reason.trim(), reviewedBy, JSON.stringify(templateJson), id],
    );

    const row = result.rows[0];
    return row ? mapProgramTemplateRow(row) : null;
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

function extractTagsFromTemplateJson(templateJson: unknown): string[] {
  if (!templateJson || typeof templateJson !== 'object' || Array.isArray(templateJson)) {
    return [];
  }
  const tags = (templateJson as { tags?: unknown }).tags;
  if (!Array.isArray(tags)) {
    return [];
  }
  return tags.filter((tag): tag is string => typeof tag === 'string');
}

export async function softDeleteProgramTemplate(id: string, gymId: string): Promise<boolean> {
  try {
    const pool = getDatabasePool();
    const result = await pool.query(
      `
        UPDATE program_templates
        SET deleted_at = now(), updated_at = now()
        WHERE id = $1 AND gym_id = $2 AND deleted_at IS NULL
      `,
      [id, gymId],
    );
    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

function generateShareToken(): string {
  return randomBytes(24).toString('base64url');
}

async function generateUniqueShareToken(): Promise<string> {
  const pool = getDatabasePool();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const token = generateShareToken();
    const existing = await pool.query(
      `
        SELECT 1
        FROM program_templates
        WHERE share_token = $1
        LIMIT 1
      `,
      [token],
    );
    if ((existing.rowCount ?? 0) === 0) {
      return token;
    }
  }
  throw new ApiError(500, 'SHARE_TOKEN_FAILED', 'Could not generate share token');
}

export async function publishProgramTemplate(
  id: string,
  gymId: string,
  actorId: string,
): Promise<ProgramTemplateDto | null> {
  void actorId;
  const existing = await getProgramTemplate(id, gymId);
  if (!existing) {
    return null;
  }

  const shareToken = existing.shareToken?.trim() || (await generateUniqueShareToken());

  try {
    const pool = getDatabasePool();
    const result = await pool.query<ProgramTemplateRow>(
      `
        UPDATE program_templates
        SET
          status = 'active',
          share_enabled = true,
          share_token = $1,
          published_at = COALESCE(published_at, now()),
          unpublished_at = NULL,
          share_created_at = COALESCE(share_created_at, now()),
          share_updated_at = now(),
          updated_at = now()
        WHERE id = $2 AND gym_id = $3 AND deleted_at IS NULL
        RETURNING *
      `,
      [shareToken, id, gymId],
    );

    const row = result.rows[0];
    return row ? mapProgramTemplateRow(row) : null;
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function unpublishProgramTemplate(
  id: string,
  gymId: string,
  actorId: string,
): Promise<ProgramTemplateDto | null> {
  void actorId;
  const existing = await getProgramTemplate(id, gymId);
  if (!existing) {
    return null;
  }

  try {
    const pool = getDatabasePool();
    const result = await pool.query<ProgramTemplateRow>(
      `
        UPDATE program_templates
        SET
          share_enabled = false,
          unpublished_at = now(),
          share_updated_at = now(),
          updated_at = now()
        WHERE id = $1 AND gym_id = $2 AND deleted_at IS NULL
        RETURNING *
      `,
      [id, gymId],
    );

    const row = result.rows[0];
    return row ? mapProgramTemplateRow(row) : null;
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function findSharedProgramByToken(
  shareToken: string,
): Promise<ProgramTemplateDto | null> {
  const normalized = shareToken.trim();
  if (!normalized) {
    return null;
  }

  try {
    const pool = getDatabasePool();
    const result = await pool.query<ProgramTemplateRow>(
      `
        SELECT *
        FROM program_templates
        WHERE share_token = $1
          AND share_enabled = true
          AND deleted_at IS NULL
          AND status = 'active'
        LIMIT 1
      `,
      [normalized],
    );

    const row = result.rows[0];
    return row ? mapProgramTemplateRow(row) : null;
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}
