import type { WorkoutVideo } from '../types/workoutProgramBuilder.types';
import { formatDuration } from '../utils/durationUtils';

const DIFFICULTY_LABEL: Record<WorkoutVideo['difficulty'], string> = {
  beginner: '초급',
  intermediate: '중급',
  advanced: '고급',
};

const DIFFICULTY_CLASS: Record<WorkoutVideo['difficulty'], string> = {
  beginner: 'beginner',
  intermediate: 'intermediate',
  advanced: 'advanced',
};

interface VideoCardProps {
  video: WorkoutVideo;
  onAdd: (video: WorkoutVideo) => void;
}

export function VideoCard({ video, onAdd }: VideoCardProps) {
  return (
    <article className="wpb-video-card">
      <div className="wpb-thumb" aria-hidden>
        <span className="wpb-thumb-placeholder" />
        <span className="wpb-thumb-icon" aria-hidden>
          ▶
        </span>
        {video.isLoopable && <span className="wpb-loop-badge">Loop</span>}
        <span className="wpb-thumb-badge">{formatDuration(video.durationSec)}</span>
      </div>
      <div className="wpb-video-info">
        <div className="wpb-video-title-row">
          <h3 title={video.title}>{video.title}</h3>
          <span className={`wpb-difficulty wpb-difficulty--${DIFFICULTY_CLASS[video.difficulty]}`}>
            {DIFFICULTY_LABEL[video.difficulty]}
          </span>
        </div>
        <div className="wpb-tags">
          {video.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="wpb-tag">
              {tag}
            </span>
          ))}
        </div>
        <div className="wpb-meta-row">
          <span className="wpb-body-parts">{video.bodyParts.join(' · ')}</span>
          <button
            type="button"
            className="wpb-btn wpb-btn-add"
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
