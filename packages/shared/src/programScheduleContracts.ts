export type ProgramScheduleStatus = 'active' | 'cancelled' | 'hidden';

export interface ProgramScheduleEntryDto {
  id: string;
  gymId: string;
  templateId: string;
  title: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  durationMin: number;
  coachName: string | null;
  roomName: string | null;
  color: string | null;
  status: ProgramScheduleStatus;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProgramScheduleEntryRequest {
  templateId: string;
  title?: string;
  dayOfWeek: number;
  startTime: string;
  durationMin: number;
  coachName?: string;
  roomName?: string;
  color?: string;
}

export interface UpdateProgramScheduleEntryRequest {
  templateId?: string;
  title?: string;
  dayOfWeek?: number;
  startTime?: string;
  durationMin?: number;
  coachName?: string;
  roomName?: string;
  color?: string;
  status?: ProgramScheduleStatus;
}

export interface ProgramScheduleEntriesResponse {
  data: ProgramScheduleEntryDto[];
}

export interface ProgramScheduleEntryResponse {
  data: ProgramScheduleEntryDto;
}

export const PROGRAM_SCHEDULE_API_PATHS = {
  entries: '/api/program-schedules/entries',
  entryById: '/api/program-schedules/entries/:id',
} as const;
