/** localStorage key for saved program templates (STEP 2+). */
export const PROGRAM_TEMPLATES_STORAGE_KEY = 'fightbox.workoutProgramTemplates.v1';

/** Default voice cue flags for newly added video blocks. */
export const DEFAULT_VIDEO_VOICE_CUES = {
  ready: true,
  go: true,
  stop: false,
  lastTenCount: false,
} as const;
