import type { WorkoutVideo } from '../types/workoutProgramBuilder.types';
import { formatDuration } from '../utils/durationUtils';
import { isUploadedVideo } from '../utils/videoManageUtils';
import { getWorkoutVideoPlaybackUrl, getWorkoutVideoPosterUrl } from '../utils/videoPlaybackUtils';
import { WorkoutVideoPlayer } from './WorkoutVideoPlayer';

const DIFFICULTY_LABEL: Record<WorkoutVideo['difficulty'], string> = {
  beginner: '초급',
  intermediate: '중급',
  advanced: '고급',
};

interface VideoLibraryPreviewProps {
  video: WorkoutVideo;
  onAdd: () => void;
}

export function VideoLibraryPreview({ video, onAdd }: VideoLibraryPreviewProps) {
  const playbackUrl = getWorkoutVideoPlaybackUrl(video);
  const posterUrl = getWorkoutVideoPosterUrl(video);

  return (
    <section className="wpb-library-preview" aria-label="라이브러리 미리보기">
      <header className="wpb-library-preview-header">
        <h3>라이브러리 미리보기</h3>
        <p>{video.title}</p>
      </header>
      <div className="wpb-library-preview-body">
        <div
          className={`wpb-library-preview-thumb${playbackUrl ? ' wpb-preview-card--playable' : ''}`}
          aria-hidden={!playbackUrl}
        >
          {playbackUrl ? (
            <WorkoutVideoPlayer video={video} className="wpb-preview-video" />
          ) : posterUrl ? (
            <img src={posterUrl} alt="" className="wpb-thumb-image wpb-library-preview-poster" />
          ) : (
            <>
              <span className="wpb-thumb-placeholder" />
              <span className="wpb-thumb-icon">▶</span>
            </>
          )}
        </div>
        <dl className="wpb-library-preview-meta">
          <div>
            <dt>길이</dt>
            <dd>{formatDuration(video.durationSec)}</dd>
          </div>
          <div>
            <dt>난이도</dt>
            <dd>{DIFFICULTY_LABEL[video.difficulty]}</dd>
          </div>
          <div>
            <dt>부위</dt>
            <dd>{video.bodyParts.join(', ')}</dd>
          </div>
          {video.description && (
            <div className="wpb-library-preview-desc">
              <dt>설명</dt>
              <dd>{video.description}</dd>
            </div>
          )}
          {!playbackUrl && isUploadedVideo(video) && (
            <div className="wpb-library-preview-desc">
              <dt>재생</dt>
              <dd>재생 URL이 없습니다. Public URL 설정 후 새로 업로드해 주세요.</dd>
            </div>
          )}
        </dl>
      </div>
      <button
        type="button"
        className="wpb-btn wpb-btn-primary wpb-library-preview-add"
        onClick={onAdd}
      >
        타임라인에 추가
      </button>
    </section>
  );
}
