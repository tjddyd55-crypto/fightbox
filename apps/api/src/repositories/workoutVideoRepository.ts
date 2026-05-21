import { randomUUID } from 'node:crypto';
import type {
  CreateUploadedVideoRequest,
  UpdateUploadedVideoRequest,
  UploadedVideoDto,
} from '@fightbox/shared';
import { getDatabasePool } from '../config/database.js';
import { ApiError } from '../utils/apiError.js';

interface UploadedVideoRow {
  id: string;
  gym_id: string;
  title: string;
  description: string;
  duration_sec: number;
  difficulty: string;
  body_parts: string[];
  tags: string[];
  is_loopable: boolean;
  visibility: string;
  is_premium: boolean;
  storage_key: string;
  playback_url: string;
  thumbnail_url: string | null;
  file_name: string;
  file_size: string;
  content_type: string;
  provider: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUploadedVideoRecord extends CreateUploadedVideoRequest {
  gymId: string;
  createdBy: string;
}

function mapUploadedVideoRow(row: UploadedVideoRow): UploadedVideoDto {
  return {
    id: row.id,
    gymId: row.gym_id,
    title: row.title,
    description: row.description,
    durationSec: row.duration_sec,
    difficulty: row.difficulty,
    bodyParts: row.body_parts ?? [],
    tags: row.tags ?? [],
    isLoopable: row.is_loopable,
    visibility: row.visibility,
    isPremium: row.is_premium,
    storageKey: row.storage_key,
    playbackUrl: row.playback_url,
    thumbnailUrl: row.thumbnail_url,
    fileName: row.file_name,
    fileSize: Number(row.file_size),
    contentType: row.content_type,
    provider: row.provider,
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

export async function listUploadedVideos(gymId: string): Promise<UploadedVideoDto[]> {
  try {
    const pool = getDatabasePool();
    const result = await pool.query<UploadedVideoRow>(
      `
        SELECT *
        FROM uploaded_videos
        WHERE gym_id = $1 AND deleted_at IS NULL
        ORDER BY updated_at DESC
      `,
      [gymId],
    );
    return result.rows.map(mapUploadedVideoRow);
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function createUploadedVideo(
  input: CreateUploadedVideoRecord,
): Promise<UploadedVideoDto> {
  const id = input.id?.trim() || `upload_${randomUUID()}`;

  try {
    const pool = getDatabasePool();
    const result = await pool.query<UploadedVideoRow>(
      `
        INSERT INTO uploaded_videos (
          id,
          gym_id,
          title,
          description,
          duration_sec,
          difficulty,
          body_parts,
          tags,
          is_loopable,
          visibility,
          is_premium,
          storage_key,
          playback_url,
          thumbnail_url,
          file_name,
          file_size,
          content_type,
          provider,
          created_by
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb,
          $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
        )
        RETURNING *
      `,
      [
        id,
        input.gymId,
        input.title.trim(),
        input.description?.trim() ?? '',
        input.durationSec,
        input.difficulty,
        JSON.stringify(input.bodyParts ?? []),
        JSON.stringify(input.tags ?? []),
        input.isLoopable,
        input.visibility,
        input.isPremium ?? false,
        input.storageKey,
        input.playbackUrl ?? '',
        input.thumbnailUrl ?? null,
        input.fileName,
        input.fileSize,
        input.contentType,
        input.provider ?? 'r2',
        input.createdBy,
      ],
    );

    const row = result.rows[0];
    if (!row) {
      throw new ApiError(500, 'DATABASE_ERROR', 'Failed to create uploaded video');
    }
    return mapUploadedVideoRow(row);
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function updateUploadedVideo(
  id: string,
  gymId: string,
  input: UpdateUploadedVideoRequest,
): Promise<UploadedVideoDto | null> {
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
  if (input.durationSec !== undefined) assign('duration_sec', input.durationSec);
  if (input.difficulty !== undefined) assign('difficulty', input.difficulty);
  if (input.bodyParts !== undefined) assign('body_parts', JSON.stringify(input.bodyParts));
  if (input.tags !== undefined) assign('tags', JSON.stringify(input.tags));
  if (input.isLoopable !== undefined) assign('is_loopable', input.isLoopable);
  if (input.visibility !== undefined) assign('visibility', input.visibility);
  if (input.isPremium !== undefined) assign('is_premium', input.isPremium);

  if (fields.length === 0) {
    throw new ApiError(400, 'INVALID_BODY', 'No updatable fields provided');
  }

  assign('updated_at', new Date());
  values.push(id, gymId);

  try {
    const pool = getDatabasePool();
    const result = await pool.query<UploadedVideoRow>(
      `
        UPDATE uploaded_videos
        SET ${fields.join(', ')}
        WHERE id = $${index} AND gym_id = $${index + 1} AND deleted_at IS NULL
        RETURNING *
      `,
      values,
    );

    const row = result.rows[0];
    return row ? mapUploadedVideoRow(row) : null;
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function softDeleteUploadedVideo(id: string, gymId: string): Promise<boolean> {
  try {
    const pool = getDatabasePool();
    const result = await pool.query(
      `
        UPDATE uploaded_videos
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
