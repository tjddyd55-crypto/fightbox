import type { ProgramBlock, WorkoutVideo } from '../types/workoutProgramBuilder.types';
import { formatDuration } from '../utils/durationUtils';
import { getVideoById } from '../utils/programTimelineUtils';
import { BLOCK_TYPE_LABEL, getBlockTypeIcon } from '../utils/blockDisplayUtils';

const DIFFICULTY_LABEL: Record<WorkoutVideo['difficulty'], string> = {
  beginner: '초급',
  intermediate: '중급',
  advanced: '고급',
};

interface BlockPreviewCardProps {
  block: ProgramBlock | null;
  videos: WorkoutVideo[];
}

function PreviewMetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="wpb-preview-meta-item">
      <span className="wpb-preview-meta-label">{label}</span>
      <span className="wpb-preview-meta-value">{value}</span>
    </div>
  );
}

export function BlockPreviewCard({ block, videos }: BlockPreviewCardProps) {
  if (!block) {
    return (
      <div className="wpb-preview-empty">
        <p className="wpb-empty-title">블록을 선택하세요</p>
        <p className="wpb-empty-desc">타임라인에서 항목을 클릭하면 이 영역에 미리보기가 표시됩니다.</p>
      </div>
    );
  }

  if (block.type === 'video') {
    const video = getVideoById(videos, block.videoId);
    return (
      <article className="wpb-preview-card">
        <section
          className="wpb-preview-media wpb-preview-media--video"
          aria-label="영상 미리보기"
        >
          <span className="wpb-preview-play-icon" aria-hidden>
            ▶
          </span>
          <span className="wpb-preview-media-label">{video?.title ?? block.title}</span>
        </section>
        <section className="wpb-preview-body">
          <span className="wpb-preview-type-badge">영상 블록</span>
          <h3>{block.title}</h3>
          <dl className="wpb-preview-meta">
            <PreviewMetaItem label="블록 길이" value={formatDuration(block.durationSec)} />
            {video && (
              <>
                <PreviewMetaItem label="원본 길이" value={formatDuration(video.durationSec)} />
                <PreviewMetaItem label="난이도" value={DIFFICULTY_LABEL[video.difficulty]} />
                <PreviewMetaItem label="운동 부위" value={video.bodyParts.join(', ')} />
                <PreviewMetaItem label="태그" value={video.tags.join(', ')} />
                <PreviewMetaItem
                  label="반복"
                  value={video.isLoopable ? 'Loop 가능' : '원본 길이'}
                />
              </>
            )}
          </dl>
        </section>
      </article>
    );
  }

  if (block.type === 'rest') {
    return (
      <article className="wpb-preview-card">
        <section className="wpb-preview-media wpb-preview-media--rest" aria-label="휴식 미리보기">
          <span className="wpb-preview-rest-timer">{formatDuration(block.durationSec)}</span>
          <span className="wpb-preview-media-label">휴식</span>
        </section>
        <section className="wpb-preview-body">
          <span className="wpb-preview-type-badge wpb-preview-type-badge--rest">휴식 블록</span>
          <h3>{block.title}</h3>
          <dl className="wpb-preview-meta">
            <PreviewMetaItem label="휴식 시간" value={formatDuration(block.durationSec)} />
            {block.nextBlockTitle && (
              <PreviewMetaItem label="다음 운동" value={block.nextBlockTitle} />
            )}
            <PreviewMetaItem label="안내" value={block.message ?? '다음 동작까지 휴식하세요'} />
          </dl>
        </section>
      </article>
    );
  }

  if (block.type === 'countdown') {
    return (
      <article className="wpb-preview-card">
        <section
          className="wpb-preview-media wpb-preview-media--countdown"
          aria-label="카운트다운 미리보기"
        >
          <span className="wpb-preview-countdown-num">{block.countFromSec}</span>
        </section>
        <section className="wpb-preview-body">
          <span className="wpb-preview-type-badge wpb-preview-type-badge--countdown">
            카운트다운
          </span>
          <h3>{block.title}</h3>
          <dl className="wpb-preview-meta">
            <PreviewMetaItem label="카운트" value={`${block.countFromSec}초`} />
            <PreviewMetaItem label="표시" value="준비하세요!" />
          </dl>
        </section>
      </article>
    );
  }

  return (
    <article className="wpb-preview-card">
      <section className="wpb-preview-media wpb-preview-media--voice" aria-label="음성 안내">
        <span className="wpb-preview-voice-icon" aria-hidden>
          {getBlockTypeIcon(block)}
        </span>
      </section>
      <section className="wpb-preview-body">
        <span className="wpb-preview-type-badge">{BLOCK_TYPE_LABEL.voice}</span>
        <h3>{block.title}</h3>
        <dl className="wpb-preview-meta">
          <PreviewMetaItem label="안내 문구" value={block.cueText} />
        </dl>
      </section>
    </article>
  );
}
