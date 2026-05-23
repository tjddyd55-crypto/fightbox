import { randomUUID } from 'node:crypto';
import type {
  CreateProgramScheduleEntryRequest,
  ProgramScheduleEntryDto,
  ProgramScheduleStatus,
  UpdateProgramScheduleEntryRequest,
} from '@fightbox/shared';
import { getDatabasePool } from '../config/database.js';
import { getProgramTemplate } from './programTemplateRepository.js';
import { ApiError } from '../utils/apiError.js';

interface ProgramScheduleRow {
  id: string;
  gym_id: string;
  template_id: string;
  title: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  duration_min: number;
  coach_name: string | null;
  room_name: string | null;
  color: string | null;
  status: string;
  created_by: string | null;
  created_at: Date;
  updated_at: Date;
}

const VALID_STATUSES: ProgramScheduleStatus[] = ['active', 'cancelled', 'hidden'];
const TIME_PATTERN = /^([01]\d|2[0-3]):(00|30)$/;

export interface CreateProgramScheduleRecord extends CreateProgramScheduleEntryRequest {
  gymId: string;
  createdBy: string;
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

function rowToDto(row: ProgramScheduleRow): ProgramScheduleEntryDto {
  return {
    id: row.id,
    gymId: row.gym_id,
    templateId: row.template_id,
    title: row.title,
    dayOfWeek: row.day_of_week,
    startTime: row.start_time,
    endTime: row.end_time,
    durationMin: row.duration_min,
    coachName: row.coach_name,
    roomName: row.room_name,
    color: row.color,
    status: row.status as ProgramScheduleStatus,
    createdBy: row.created_by,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function parseTimeToMinutes(time: string): number {
  const [hourRaw, minuteRaw] = time.split(':');
  const hour = Number.parseInt(hourRaw ?? '', 10);
  const minute = Number.parseInt(minuteRaw ?? '', 10);
  return hour * 60 + minute;
}

function minutesToTime(totalMinutes: number): string {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function computeEndTime(startTime: string, durationMin: number): string {
  return minutesToTime(parseTimeToMinutes(startTime) + durationMin);
}

function assertDayOfWeek(dayOfWeek: number): void {
  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    throw new ApiError(400, 'INVALID_DAY_OF_WEEK', 'dayOfWeek must be between 0 (Sunday) and 6 (Saturday)');
  }
}

function assertStartTime(startTime: string): void {
  if (!TIME_PATTERN.test(startTime)) {
    throw new ApiError(
      400,
      'INVALID_START_TIME',
      'startTime must be HH:mm in 30-minute increments (e.g. 06:00, 06:30)',
    );
  }
}

function assertDurationMin(durationMin: number): void {
  if (!Number.isInteger(durationMin) || durationMin < 30 || durationMin % 30 !== 0) {
    throw new ApiError(
      400,
      'INVALID_DURATION',
      'durationMin must be an integer >= 30 in 30-minute increments',
    );
  }
}

function assertStatus(status: string): asserts status is ProgramScheduleStatus {
  if (!VALID_STATUSES.includes(status as ProgramScheduleStatus)) {
    throw new ApiError(400, 'INVALID_STATUS', `Invalid schedule status: ${status}`);
  }
}

function timesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  const aStart = parseTimeToMinutes(startA);
  const aEnd = parseTimeToMinutes(endA);
  const bStart = parseTimeToMinutes(startB);
  const bEnd = parseTimeToMinutes(endB);
  return aStart < bEnd && bStart < aEnd;
}

async function assertTemplateBelongsToGym(templateId: string, gymId: string): Promise<string> {
  const template = await getProgramTemplate(templateId, gymId);
  if (!template) {
    throw new ApiError(404, 'TEMPLATE_NOT_FOUND', 'Program template not found for this gym');
  }
  return template.title;
}

async function assertNoRoomConflict(input: {
  gymId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  roomName?: string | null;
  excludeId?: string;
}): Promise<void> {
  const roomName = input.roomName?.trim();
  if (!roomName) {
    return;
  }

  const pool = getDatabasePool();
  const result = await pool.query<ProgramScheduleRow>(
    `SELECT id, start_time, end_time, room_name
     FROM program_schedule_entries
     WHERE gym_id = $1
       AND day_of_week = $2
       AND deleted_at IS NULL
       AND status = 'active'
       AND room_name IS NOT NULL
       AND lower(trim(room_name)) = lower(trim($3))
       AND ($4::text IS NULL OR id <> $4)`,
    [input.gymId, input.dayOfWeek, roomName, input.excludeId ?? null],
  );

  for (const row of result.rows) {
    if (timesOverlap(input.startTime, input.endTime, row.start_time, row.end_time)) {
      throw new ApiError(
        409,
        'SCHEDULE_CONFLICT',
        `Room "${roomName}" is already scheduled during this time`,
      );
    }
  }
}

export async function listProgramScheduleEntries(gymId: string): Promise<ProgramScheduleEntryDto[]> {
  try {
    const pool = getDatabasePool();
    const result = await pool.query<ProgramScheduleRow>(
      `SELECT id, gym_id, template_id, title, day_of_week, start_time, end_time, duration_min,
              coach_name, room_name, color, status, created_by, created_at, updated_at
       FROM program_schedule_entries
       WHERE gym_id = $1 AND deleted_at IS NULL
       ORDER BY day_of_week ASC, start_time ASC`,
      [gymId],
    );
    return result.rows.map(rowToDto);
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function getProgramScheduleEntry(
  id: string,
  gymId: string,
): Promise<ProgramScheduleEntryDto | null> {
  try {
    const pool = getDatabasePool();
    const result = await pool.query<ProgramScheduleRow>(
      `SELECT id, gym_id, template_id, title, day_of_week, start_time, end_time, duration_min,
              coach_name, room_name, color, status, created_by, created_at, updated_at
       FROM program_schedule_entries
       WHERE id = $1 AND gym_id = $2 AND deleted_at IS NULL`,
      [id, gymId],
    );
    return result.rows[0] ? rowToDto(result.rows[0]) : null;
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function createProgramScheduleEntry(
  input: CreateProgramScheduleRecord,
): Promise<ProgramScheduleEntryDto> {
  assertDayOfWeek(input.dayOfWeek);
  assertStartTime(input.startTime);
  assertDurationMin(input.durationMin);

  const templateTitle = await assertTemplateBelongsToGym(input.templateId, input.gymId);
  const endTime = computeEndTime(input.startTime, input.durationMin);
  const title = input.title?.trim() || templateTitle;

  await assertNoRoomConflict({
    gymId: input.gymId,
    dayOfWeek: input.dayOfWeek,
    startTime: input.startTime,
    endTime,
    roomName: input.roomName,
  });

  try {
    const pool = getDatabasePool();
    const id = `schedule-${randomUUID()}`;
    const result = await pool.query<ProgramScheduleRow>(
      `INSERT INTO program_schedule_entries (
         id, gym_id, template_id, title, day_of_week, start_time, end_time, duration_min,
         coach_name, room_name, color, status, created_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active', $12)
       RETURNING id, gym_id, template_id, title, day_of_week, start_time, end_time, duration_min,
                 coach_name, room_name, color, status, created_by, created_at, updated_at`,
      [
        id,
        input.gymId,
        input.templateId,
        title,
        input.dayOfWeek,
        input.startTime,
        endTime,
        input.durationMin,
        input.coachName?.trim() || null,
        input.roomName?.trim() || null,
        input.color?.trim() || null,
        input.createdBy,
      ],
    );
    return rowToDto(result.rows[0]);
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function updateProgramScheduleEntry(
  id: string,
  gymId: string,
  input: UpdateProgramScheduleEntryRequest,
): Promise<ProgramScheduleEntryDto> {
  const existing = await getProgramScheduleEntry(id, gymId);
  if (!existing) {
    throw new ApiError(404, 'SCHEDULE_NOT_FOUND', 'Schedule entry not found');
  }

  const dayOfWeek = input.dayOfWeek ?? existing.dayOfWeek;
  const startTime = input.startTime ?? existing.startTime;
  const durationMin = input.durationMin ?? existing.durationMin;

  assertDayOfWeek(dayOfWeek);
  assertStartTime(startTime);
  assertDurationMin(durationMin);

  if (input.status !== undefined) {
    assertStatus(input.status);
  }

  let templateId = existing.templateId;
  let title = input.title?.trim() ?? existing.title;

  if (input.templateId && input.templateId !== existing.templateId) {
    templateId = input.templateId;
    const templateTitle = await assertTemplateBelongsToGym(templateId, gymId);
    if (!input.title?.trim()) {
      title = templateTitle;
    }
  }

  const endTime = computeEndTime(startTime, durationMin);
  const roomName =
    input.roomName !== undefined ? input.roomName.trim() || null : existing.roomName;
  const coachName =
    input.coachName !== undefined ? input.coachName.trim() || null : existing.coachName;
  const color = input.color !== undefined ? input.color.trim() || null : existing.color;
  const status = input.status ?? existing.status;

  await assertNoRoomConflict({
    gymId,
    dayOfWeek,
    startTime,
    endTime,
    roomName,
    excludeId: id,
  });

  try {
    const pool = getDatabasePool();
    const result = await pool.query<ProgramScheduleRow>(
      `UPDATE program_schedule_entries
       SET template_id = $3,
           title = $4,
           day_of_week = $5,
           start_time = $6,
           end_time = $7,
           duration_min = $8,
           coach_name = $9,
           room_name = $10,
           color = $11,
           status = $12,
           updated_at = now()
       WHERE id = $1 AND gym_id = $2 AND deleted_at IS NULL
       RETURNING id, gym_id, template_id, title, day_of_week, start_time, end_time, duration_min,
                 coach_name, room_name, color, status, created_by, created_at, updated_at`,
      [
        id,
        gymId,
        templateId,
        title,
        dayOfWeek,
        startTime,
        endTime,
        durationMin,
        coachName,
        roomName,
        color,
        status,
      ],
    );

    if (!result.rows[0]) {
      throw new ApiError(404, 'SCHEDULE_NOT_FOUND', 'Schedule entry not found');
    }

    return rowToDto(result.rows[0]);
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}

export async function deleteProgramScheduleEntry(id: string, gymId: string): Promise<void> {
  try {
    const pool = getDatabasePool();
    const result = await pool.query(
      `UPDATE program_schedule_entries
       SET deleted_at = now(), updated_at = now()
       WHERE id = $1 AND gym_id = $2 AND deleted_at IS NULL`,
      [id, gymId],
    );

    if (result.rowCount === 0) {
      throw new ApiError(404, 'SCHEDULE_NOT_FOUND', 'Schedule entry not found');
    }
  } catch (error) {
    throw wrapDatabaseError(error);
  }
}
