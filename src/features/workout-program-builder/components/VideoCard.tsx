import type { WorkoutVideo } from '../types/workoutProgramBuilder.types';
import { formatDuration } from '../utils/durationUtils';

const DIFFICULTY_LABEL: Record<WorkoutVideo['difficulty'], string> = {
  beginner: '초급',
  intermediate: '중급',
  advanced: '고급',
};

interface VideoCardProps {
  video: WorkoutVideo;
  onAdd: (video: WorkoutVideo) => void;
}

export function VideoCard({ video, onAdd }: VideoCardProps) {
  return (
    <article className="wpb-video-card">
      <div className="wpb-thumb" aria-hidden>
        {video.isLoopable && <span className="wpb-loop-badge">Loop</span>}
        <span className="wpb-thumb-badge">{formatDuration(video.durationSec)}</span>
      </div>
      <div className="wpb-video-info">
        <h3 title={video.title}>{video.title}</h3>
        <div className="wpb-tags">
          {video.tags.map((tag) => (
            <span key={tag} className="wpb-tag">
              {tag}
            </span>
          ))}
        </div>
        <div className="wpb-meta-row">
          <span>{DIFFICULTY_LABEL[video.difficulty]}</span>
          <button
            type="button"
            className="wpb-btn wpb-btn-primary"
            onClick={() => onAdd(video)}
            aria-label={`${video.title} 타임라인에 추가`}
          >
            추가
          </button>
        </div>
      </div>
    </article>
  );
}
