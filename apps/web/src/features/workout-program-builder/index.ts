export * from './types/workoutProgramBuilder.types';
export { mockWorkoutVideos } from './data/mockWorkoutVideos';
export { mockProgramTemplate } from './data/mockProgramTemplate';
export { formatDuration } from './utils/durationUtils';
export {
  filterWorkoutVideos,
  createDefaultVideoFilters,
  hasActiveVideoFilters,
  type VideoLibraryFilters,
  type VideoDurationRange,
} from './utils/videoFilterUtils';
export {
  calculateTotalDurationSec,
  buildWorkoutVideoMap,
  getBlockDurationSeconds,
  getBlockTimelineContributionSeconds,
  getTimelineTotalDurationSeconds,
  getBlockPlaybackLabel,
  reorderBlocks,
  reindexBlocks,
  cloneProgramBlock,
  duplicateBlockInList,
  createRestBlock,
  createCountdownBlock,
  createVoiceBlock,
  createVideoBlockFromWorkout,
  computeVideoBlockDuration,
  getVideoById,
  getAllTags,
} from './utils/programTimelineUtils';
export { validateProgramBlocks } from './utils/programValidationUtils';
export {
  isVideoBlock,
  isRestBlock,
  isCountdownBlock,
  isVoiceBlock,
} from './utils/programBlockGuards';
export { PROGRAM_TEMPLATES_STORAGE_KEY } from './constants/builderConstants';
