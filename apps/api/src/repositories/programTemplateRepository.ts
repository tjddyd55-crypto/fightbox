import { randomUUID } from 'node:crypto';
import type {
  CreateProgramTemplateRequest,
  ProgramTemplateDto,
  UpdateProgramTemplateRequest,
} from '@fightbox/shared';
import { getDatabasePool } from '../config/database.js';
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
