import type { ProgramPlayerBlock, ProgramPlayerMeta } from '../types/programPlayer.types';

export const MOCK_PROGRAM_BLOCKS: ProgramPlayerBlock[] = [
  { id: 'b1', type: 'video', order: 1, title: '다이나믹 워밍업', durationSec: 312 },
  { id: 'b2', type: 'video', order: 2, title: '스쿼트 기본', durationSec: 225 },
  { id: 'b3', type: 'rest', order: 3, title: '휴식 30초', durationSec: 30, subtitle: '다음 · 버피 10초 루프' },
  { id: 'b4', type: 'video', order: 4, title: '버피 10초 루프', durationSec: 180 },
  { id: 'b5', type: 'countdown', order: 5, title: '카운트다운 10초', durationSec: 10, subtitle: '다음 · 복근 코어 루틴' },
  { id: 'b6', type: 'video', order: 6, title: '복근 코어 루틴', durationSec: 300 },
  { id: 'b7', type: 'video', order: 7, title: '마무리 스트레칭', durationSec: 240 },
  { id: 'b8', type: 'rest', order: 8, title: '휴식 20초', durationSec: 20, subtitle: '다음 · 정리 운동' },
  { id: 'b9', type: 'video', order: 9, title: '정리 운동', durationSec: 238 },
];

export const MOCK_PROGRAM_META: ProgramPlayerMeta = {
  title: '전신 인터벌 프로그램',
  totalDurationSec: 1515,
  totalBlocks: 9,
  summary: { video: 7, rest: 1, countdown: 1 },
  flowPreview: '웜업 → 스쿼트 → 휴식 → 버피 → 카운트다운 → 코어 → 스트레칭 → 휴식 → 정리',
};
