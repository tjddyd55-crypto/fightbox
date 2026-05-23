import type {
  CreateProgramScheduleEntryRequest,
  UpdateProgramScheduleEntryRequest,
} from '@fightbox/shared';
import { ApiError } from './apiError.js';

function readObject(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ApiError(400, 'INVALID_BODY', 'Request body must be an object');
  }
  return body as Record<string, unknown>;
}

function readStringField(body: Record<string, unknown>, field: string, required = false): string {
  const value = body[field];
  if (value === undefined || value === null) {
    if (required) {
      throw new ApiError(400, 'INVALID_FIELD', `${field} is required`);
    }
    return '';
  }
  if (typeof value !== 'string') {
    throw new ApiError(400, 'INVALID_FIELD', `${field} must be a string`);
  }
  return value.trim();
}

function readNumberField(body: Record<string, unknown>, field: string, required = false): number {
  const value = body[field];
  if (value === undefined || value === null) {
    if (required) {
      throw new ApiError(400, 'INVALID_FIELD', `${field} is required`);
    }
    return Number.NaN;
  }
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new ApiError(400, 'INVALID_FIELD', `${field} must be an integer`);
  }
  return value;
}

export function parseCreateProgramScheduleBody(body: unknown): CreateProgramScheduleEntryRequest {
  const record = readObject(body);
  const templateId = readStringField(record, 'templateId', true);
  const startTime = readStringField(record, 'startTime', true);
  const dayOfWeek = readNumberField(record, 'dayOfWeek', true);
  const durationMin = readNumberField(record, 'durationMin', true);

  const title = readStringField(record, 'title');
  const coachName = readStringField(record, 'coachName');
  const roomName = readStringField(record, 'roomName');
  const color = readStringField(record, 'color');

  return {
    templateId,
    startTime,
    dayOfWeek,
    durationMin,
    ...(title ? { title } : {}),
    ...(coachName ? { coachName } : {}),
    ...(roomName ? { roomName } : {}),
    ...(color ? { color } : {}),
  };
}

export function parseUpdateProgramScheduleBody(body: unknown): UpdateProgramScheduleEntryRequest {
  const record = readObject(body);
  const input: UpdateProgramScheduleEntryRequest = {};

  if ('templateId' in record) {
    input.templateId = readStringField(record, 'templateId', true);
  }
  if ('title' in record) {
    input.title = readStringField(record, 'title');
  }
  if ('dayOfWeek' in record) {
    input.dayOfWeek = readNumberField(record, 'dayOfWeek', true);
  }
  if ('startTime' in record) {
    input.startTime = readStringField(record, 'startTime', true);
  }
  if ('durationMin' in record) {
    input.durationMin = readNumberField(record, 'durationMin', true);
  }
  if ('coachName' in record) {
    input.coachName = readStringField(record, 'coachName');
  }
  if ('roomName' in record) {
    input.roomName = readStringField(record, 'roomName');
  }
  if ('color' in record) {
    input.color = readStringField(record, 'color');
  }
  if ('status' in record) {
    const status = readStringField(record, 'status', true);
    if (status !== 'active' && status !== 'cancelled' && status !== 'hidden') {
      throw new ApiError(400, 'INVALID_STATUS', 'status must be active, cancelled, or hidden');
    }
    input.status = status;
  }

  if (Object.keys(input).length === 0) {
    throw new ApiError(400, 'EMPTY_UPDATE', 'At least one field is required to update');
  }

  return input;
}
