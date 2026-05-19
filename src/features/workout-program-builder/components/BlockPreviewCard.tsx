import type { ProgramBlock, WorkoutVideo } from '../types/workoutProgramBuilder.types';
import { formatDuration } from '../utils/durationUtils';
import { getVideoById } from '../utils/programTimelineUtils';

const DIFFICULTY_LABEL: Record<WorkoutVideo['difficulty'], string> = {
  beginner: '초급',
  intermediate: '중급',
  advanced: '고급',
};

interface BlockPreviewCardProps {
  block: ProgramBlock | null;
  videos: WorkoutVideo[];
}

export function BlockPreviewCard({ block, videos }: BlockPreviewCardProps) {
  if (!block) {
    return <p className="wpb-empty">타임라인에서 블록을 선택하세요.</p>;
  }

  if (block.type === 'video') {
    const video = getVideoById(videos, block.videoId);
    return (
      <article className="wpb-preview-card">
        <section className="wpb-preview-media" aria-label="영상 미리보기">
          {video?.title ?? block.title} 미리보기
        </section>
        <section className="wpb-preview-body">
          <h3>{block.title}</h3>
          <p>길이: {formatDuration(block.durationSec)}</p>
          {video && (
            <>
              <p>태그: {video.tags.join(', ')}</p>
              <p>난이도: {DIFFICULTY_LABEL[video.difficulty]}</p>
              <p>운동 부위: {video.bodyParts.join(', ')}</p>
              <p>{video.isLoopable ? '반복 가능 (Loop)' : '원본 길이 재생'}</p>
            </>
          )}
        </section>
      </article>
    );
  }

  if (block.type === 'rest') {
    return (
      <article className="wpb-preview-card">
        <section className="wpb-preview-media">휴식 타이머</section>
        <section className="wpb-preview-body">
          <h3>{block.title}</h3>
          <p>휴식 시간: {formatDuration(block.durationSec)}</p>
          {block.nextBlockTitle && <p>다음 운동: {block.nextBlockTitle}</p>}
          <p>{block.message ?? '다음 동작까지 휴식하세요'}</p>
        </section>
      </article>
    );
  }

  if (block.type === 'countdown') {
    return (
      <article className="wpb-preview-card">
        <section className="wpb-preview-media">{block.countFromSec}</section>
        <section className="wpb-preview-body">
          <h3>{block.title}</h3>
          <p>카운트다운: {block.countFromSec}초</p>
          <p>준비하세요!</p>
        </section>
      </article>
    );
  }

  return (
    <article className="wpb-preview-card">
      <section className="wpb-preview-media">음성 안내</section>
      <section className="wpb-preview-body">
        <h3>{block.title}</h3>
        <p>{block.cueText}</p>
      </section>
    </article>
  );
}
