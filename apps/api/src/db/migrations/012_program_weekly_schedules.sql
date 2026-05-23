-- Weekly recurring program schedule entries (day-of-week + time, not calendar dates)

CREATE TABLE IF NOT EXISTS program_schedule_entries (
  id text PRIMARY KEY,
  gym_id text NOT NULL,
  template_id text NOT NULL,
  title text NOT NULL,
  day_of_week integer NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  duration_min integer NOT NULL,
  coach_name text,
  room_name text,
  color text,
  status text NOT NULL DEFAULT 'active',
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS program_schedule_entries_gym_day_start_idx
  ON program_schedule_entries (gym_id, day_of_week, start_time);

CREATE INDEX IF NOT EXISTS program_schedule_entries_gym_status_idx
  ON program_schedule_entries (gym_id, status);

CREATE INDEX IF NOT EXISTS program_schedule_entries_template_idx
  ON program_schedule_entries (template_id);

CREATE INDEX IF NOT EXISTS program_schedule_entries_deleted_at_idx
  ON program_schedule_entries (deleted_at);
