import type { ProgramBlock, WorkoutVideo } from '../types/workoutProgramBuilder.types';
import { formatDuration } from '../utils/durationUtils';
import { getVideoById } from '../utils/programTimelineUtils';
import { isUploadedVideo } from '../utils/videoManageUtils';
import {
  getWorkoutVideoPlaybackUrl,
  getWorkoutVideoPosterUrl,
  isYouTubeWorkoutVideo,
} from '../utils/videoPlaybackUtils';
import { WorkoutVideoPlayer } from './WorkoutVideoPlayer';

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
    <>
      <dt className="wpb-preview-meta-label">{label}</dt>
      <dd className="wpb-preview-meta-value">{value}</dd>
    </>
  );
}

function PreviewMedia({ block, videos }: { block: ProgramBlock; videos: WorkoutVideo[] }) {
  if (block.type === 'video') {
    const video = getVideoById(videos, block.videoId);
    const playbackUrl = getWorkoutVideoPlaybackUrl(video);
    const posterUrl = getWorkoutVideoPosterUrl(video);
    const canPlay = Boolean(playbackUrl) || isYouTubeWorkoutVideo(video);

    if (canPlay) {
      return (
        <section
          className="wpb-preview-media wpb-preview-media--video wpb-preview-card--playable"
          aria-label="영상 미리보기"
        >
          <WorkoutVideoPlayer video={video} className="wpb-preview-video" />
        </section>
      );
    }

    return (
      <section
        className="wpb-preview-media wpb-preview-media--video"
        aria-label="영상 미리보기"
      >
        {posterUrl ? (
          <img src={posterUrl} alt="" className="wpb-preview-poster-image" />
        ) : (
          <span className="wpb-preview-play-icon" aria-hidden>
            ▶
          </span>
        )}
        {video && isUploadedVideo(video) && !posterUrl && (
          <p className="wpb-preview-no-playback-hint">
            재생 URL이 없습니다. Public URL 설정 후 새로 업로드해 주세요.
          </p>
        )}
      </section>
    );
  }

  if (block.type === 'rest') {
    return (
      <section className="wpb-preview-media wpb-preview-media--rest" aria-label="휴식 미리보기">
        <span className="wpb-preview-placeholder-icon" aria-hidden>
          ◌
        </span>
        <span className="wpb-preview-placeholder-title">휴식 {formatDuration(block.durationSec)}</span>
        <span className="wpb-preview-media-label">
          {block.message ?? '다음 동작까지 휴식'}
        </span>
      </section>
    );
  }

  if (block.type === 'countdown') {
    return (
      <section
        className="wpb-preview-media wpb-preview-media--countdown"
        aria-label="카운트다운 미리보기"
      >
        <span className="wpb-preview-countdown-ring" aria-hidden>
          {block.countFromSec}
        </span>
        <span className="wpb-preview-placeholder-title">
          카운트다운 {block.countFromSec}초
        </span>
      </section>
    );
  }

  return (
    <section className="wpb-preview-media wpb-preview-media--voice" aria-label="음성 안내">
      <span className="wpb-preview-placeholder-icon" aria-hidden>
        🎤
      </span>
      <span className="wpb-preview-placeholder-title">음성 안내</span>
      <span className="wpb-preview-media-label">{block.cueText}</span>
    </section>
  );
}

function PreviewMeta({ block, videos }: { block: ProgramBlock; videos: WorkoutVideo[] }) {
  if (block.type === 'video') {
    const video = getVideoById(videos, block.videoId);
    return (
      <dl className="wpb-preview-meta">
        <PreviewMetaItem label="블록 길이" value={formatDuration(block.durationSec)} />
        {video && (
          <>
            <PreviewMetaItem label="원본" value={formatDuration(video.durationSec)} />
            <PreviewMetaItem label="난이도" value={DIFFICULTY_LABEL[video.difficulty]} />
            <PreviewMetaItem label="부위" value={video.bodyParts.join(', ')} />
          </>
        )}
      </dl>
    );
  }

  if (block.type === 'rest') {
    return (
      <dl className="wpb-preview-meta">
        <PreviewMetaItem label="휴식" value={formatDuration(block.durationSec)} />
        {block.nextBlockTitle && (
          <PreviewMetaItem label="다음" value={block.nextBlockTitle} />
        )}
      </dl>
    );
  }

  if (block.type === 'countdown') {
    return (
      <dl className="wpb-preview-meta">
        <PreviewMetaItem label="카운트" value={`${block.countFromSec}초`} />
      </dl>
    );
  }

  return (
    <dl className="wpb-preview-meta">
      <PreviewMetaItem label="문구" value={block.cueText} />
    </dl>
  );
}

export function BlockPreviewCard({ block, videos }: BlockPreviewCardProps) {
  if (!block) {
    return (
      <div className="wpb-right-empty">
        <p className="wpb-empty-title">블록을 선택하세요</p>
        <p className="wpb-empty-desc">타임라인에서 항목을 클릭하면 미리보기가 표시됩니다.</p>
      </div>
    );
  }

  return (
    <div className="wpb-right-stack">
      <div className="wpb-right-preview" aria-label="블록 미리보기">
        <article className="wpb-preview-card wpb-preview-card--player">
          <PreviewMedia block={block} videos={videos} />
        </article>
      </div>

      <section className="wpb-right-block-info" aria-label="블록 정보">
        <h3 className="wpb-block-info-title">{block.title}</h3>
        <PreviewMeta block={block} videos={videos} />
      </section>
    </div>
  );
}
