import { useEffect, useRef, useState } from 'react';
import type { WorkoutVideo } from '../types/workoutProgramBuilder.types';
import { formatDuration } from '../utils/durationUtils';
import { isUploadedVideo } from '../utils/videoManageUtils';
import { getWorkoutVideoPlaybackUrl, getWorkoutVideoPosterUrl } from '../utils/videoPlaybackUtils';

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
  isSelected: boolean;
  onSelect: (videoId: string) => void;
  onAdd: (video: WorkoutVideo) => void;
  onEdit?: (video: WorkoutVideo) => void;
  onDelete?: (video: WorkoutVideo) => void;
}

export function VideoCard({
  video,
  isSelected,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
}: VideoCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuWrapRef = useRef<HTMLDivElement>(null);
  const canManage = isUploadedVideo(video);
  const playbackUrl = getWorkoutVideoPlaybackUrl(video);
  const posterUrl = getWorkoutVideoPosterUrl(video);

  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (menuWrapRef.current?.contains(event.target as Node)) return;
      setMenuOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [menuOpen]);

  return (
    <article
      className={`wpb-video-card${isSelected ? ' selected' : ''}`}
      onClick={() => onSelect(video.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(video.id);
        }
      }}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`${video.title} 미리보기 선택`}
    >
      <div className={`wpb-thumb${playbackUrl ? ' wpb-thumb--playable' : ''}`} aria-hidden>
        {playbackUrl ? (
          <video
            className="wpb-thumb-video"
            src={playbackUrl}
            poster={posterUrl}
            preload="metadata"
            muted
            playsInline
            tabIndex={-1}
          />
        ) : posterUrl ? (
          <img src={posterUrl} alt="" className="wpb-thumb-image" />
        ) : (
          <span className="wpb-thumb-placeholder" />
        )}
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
          {(video.isPremium || (video.creditCost ?? 0) > 0) && (
            <span className="wpb-credit-badge">{video.creditCost ?? 0} 크레딧</span>
          )}
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
          <div className="wpb-video-card-actions">
            {canManage && (
              <div
                ref={menuWrapRef}
                className="wpb-video-manage-wrap"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="wpb-icon-btn wpb-menu-trigger"
                  aria-label={`${video.title} 관리`}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  onClick={() => setMenuOpen((open) => !open)}
                >
                  ⋯
                </button>
                {menuOpen && (
                  <ul className="wpb-timeline-menu wpb-video-manage-menu" role="menu">
                    <li role="none">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          onEdit?.(video);
                          setMenuOpen(false);
                        }}
                      >
                        수정
                      </button>
                    </li>
                    <li role="none">
                      <button
                        type="button"
                        role="menuitem"
                        className="danger"
                        onClick={() => {
                          onDelete?.(video);
                          setMenuOpen(false);
                        }}
                      >
                        삭제
                      </button>
                    </li>
                  </ul>
                )}
              </div>
            )}
            <button
              type="button"
              className="wpb-btn wpb-btn-add"
              onClick={(e) => {
                e.stopPropagation();
                onAdd(video);
              }}
              aria-label={`${video.title} 타임라인에 추가`}
            >
              추가
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}