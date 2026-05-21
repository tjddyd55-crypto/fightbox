import type { WorkoutProgramTemplate } from '../types/workoutProgramBuilder.types';
import { mockWorkoutVideos } from './mockWorkoutVideos';
import {
  buildWorkoutVideoMap,
  getTimelineTotalDurationSeconds,
} from '../utils/programTimelineUtils';

const blocks: WorkoutProgramTemplate['blocks'] = [
  {
    id: 'block_warmup',
    type: 'video',
    title: '다이내믹 워밍업',
    order: 1,
    durationSec: 300,
    videoId: 'video_warmup_001',
    playMode: 'loop_until_duration',
    targetDurationSec: 300,
    restAfterSec: 0,
    voiceCues: { ready: true, go: true, stop: false, lastTenCount: false },
  },
  {
    id: 'block_squat',
    type: 'video',
    title: '스쿼트 기본',
    order: 2,
    durationSec: 180,
    videoId: 'video_squat_001',
    playMode: 'loop_until_duration',
    targetDurationSec: 180,
    restAfterSec: 0,
    voiceCues: { ready: true, go: true, stop: true, lastTenCount: false },
  },
  {
    id: 'block_rest_1',
    type: 'rest',
    title: '휴식 30초',
    order: 3,
    durationSec: 30,
    message: '다음 운동까지 휴식하세요',
    nextBlockTitle: '버피 10초 루프',
  },
  {
    id: 'block_burpee',
    type: 'video',
    title: '버피 10초 루프 · 3분 반복',
    order: 4,
    durationSec: 180,
    videoId: 'video_burpee_loop_001',
    playMode: 'loop_until_duration',
    targetDurationSec: 180,
    restAfterSec: 10,
    voiceCues: { ready: true, go: true, stop: true, lastTenCount: true },
  },
  {
    id: 'block_countdown',
    type: 'countdown',
    title: '카운트다운 10초',
    order: 5,
    durationSec: 10,
    countFromSec: 10,
  },
  {
    id: 'block_abs',
    type: 'video',
    title: '복근 코어 루틴',
    order: 6,
    durationSec: 300,
    videoId: 'video_abs_001',
    playMode: 'original_duration',
    restAfterSec: 0,
    voiceCues: { ready: false, go: true, stop: true, lastTenCount: true },
  },
  {
    id: 'block_stretch',
    type: 'video',
    title: '마무리 스트레칭',
    order: 7,
    durationSec: 240,
    videoId: 'video_stretch_001',
    playMode: 'original_duration',
    restAfterSec: 0,
    voiceCues: { ready: false, go: false, stop: true, lastTenCount: false },
  },
];

const now = new Date().toISOString();

export const mockProgramTemplate: WorkoutProgramTemplate = {
  id: 'template_demo_001',
  title: '전신 인터벌 프로그램',
  description: '워밍업 → 스쿼트 → 휴식 → 버피 반복 → 카운트다운 → 복근 → 스트레칭',
  tags: ['전신', '인터벌', '초급-중급'],
  totalDurationSec: getTimelineTotalDurationSeconds(
    blocks,
    buildWorkoutVideoMap(mockWorkoutVideos),
  ),
  blocks,
  visibility: 'gym_only',
  createdAt: now,
  updatedAt: now,
  ownerGymId: 'gym_demo_001',
};
