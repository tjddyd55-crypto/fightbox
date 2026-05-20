/** localStorage key for saved program templates (STEP 2+). */
export const PROGRAM_TEMPLATES_STORAGE_KEY = 'fightbox.workoutProgramTemplates.v1';

/** localStorage key for user-registered workout videos (metadata only). */
export const UPLOADED_VIDEOS_STORAGE_KEY = 'fightbox.workoutProgramBuilder.uploadedVideos.v1';

/** Placeholder thumbnail for locally registered videos (no blob persisted). */
export const UPLOADED_VIDEO_PLACEHOLDER_THUMBNAIL = '/mock/workout/upload-placeholder.jpg';

/** Selectable body parts when registering a video. */
export const VIDEO_BODY_PART_OPTIONS = ['전신', '하체', '상체', '복근', '코어'] as const;

/** Default voice cue flags for newly added video blocks. */
export const DEFAULT_VIDEO_VOICE_CUES = {
  ready: true,
  go: true,
  stop: false,
  lastTenCount: false,
} as const;
