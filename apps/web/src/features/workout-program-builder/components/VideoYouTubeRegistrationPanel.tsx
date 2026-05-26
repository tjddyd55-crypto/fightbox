import { useEffect, useId, useState } from 'react';
import { VIDEO_BODY_PART_OPTIONS } from '../constants/builderConstants';
import type {
  CreateYouTubeWorkoutVideoInput,
  UploadedVideoVisibility,
  WorkoutDifficulty,
} from '../types/workoutProgramBuilder.types';
import {
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
  parseYouTubeVideoId,
} from '../utils/youtubeVideoUtils';
import { WorkoutYouTubeEmbed } from './WorkoutYouTubeEmbed';

const DIFFICULTY_OPTIONS: { value: WorkoutDifficulty; label: string }[] = [
  { value: 'beginner', label: '초급' },
  { value: 'intermediate', label: '중급' },
  { value: 'advanced', label: '고급' },
];

const VISIBILITY_OPTIONS: { value: UploadedVideoVisibility; label: string }[] = [
  { value: 'private', label: '비공개 (나만)' },
  { value: 'gym_only', label: '체육관 전용' },
];

interface VideoYouTubeRegistrationPanelProps {
  onSubmit: (input: CreateYouTubeWorkoutVideoInput) => boolean;
  onCancel: () => void;
}

export function VideoYouTubeRegistrationPanel({
  onSubmit,
  onCancel,
}: VideoYouTubeRegistrationPanelProps) {
  const formId = useId();
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [parsedVideoId, setParsedVideoId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [bodyParts, setBodyParts] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<WorkoutDifficulty | ''>('');
  const [durationSec, setDurationSec] = useState(60);
  const [isLoopable, setIsLoopable] = useState(true);
  const [visibility, setVisibility] = useState<UploadedVideoVisibility>('gym_only');
  const [isPremium, setIsPremium] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const id = parseYouTubeVideoId(youtubeUrl);
    setParsedVideoId(id);
    setUrlError(id || !youtubeUrl.trim() ? null : '유효한 YouTube URL을 입력해 주세요.');
    if (id && !title.trim()) {
      setTitle('YouTube 영상');
    }
  }, [youtubeUrl, title]);

  const toggleBodyPart = (part: string) => {
    setBodyParts((prev) =>
      prev.includes(part) ? prev.filter((p) => p !== part) : [...prev, part],
    );
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const videoId = parseYouTubeVideoId(youtubeUrl);
    if (!videoId) {
      setUrlError('유효한 YouTube URL을 입력해 주세요.');
      return;
    }
    if (!difficulty) {
      setFormError('난이도를 선택해 주세요.');
      return;
    }
    if (durationSec < 1) {
      setFormError('길이는 1초 이상이어야 합니다.');
      return;
    }
    if (bodyParts.length === 0) {
      setFormError('운동 부위를 1개 이상 선택해 주세요.');
      return;
    }

    const tags = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    if (tags.length === 0) {
      setFormError('태그를 1개 이상 입력해 주세요.');
      return;
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
    const resolvedTitle = title.trim() || 'YouTube 영상';
    const externalUrl = youtubeUrl.trim().includes('http')
      ? youtubeUrl.trim()
      : `https://www.youtube.com/watch?v=${videoId}`;

    const input: CreateYouTubeWorkoutVideoInput = {
      title: resolvedTitle,
      description: description.trim() || undefined,
      durationSec,
      tags,
      bodyParts,
      difficulty,
      isLoopable,
      visibility,
      isPremium,
      youtubeUrl: externalUrl,
      youtubeVideoId: videoId,
      embedUrl: getYouTubeEmbedUrl(videoId, origin),
      thumbnailUrl: getYouTubeThumbnailUrl(videoId),
      externalUrl,
    };

    const ok = onSubmit(input);
    if (!ok) {
      setFormError('등록에 실패했습니다.');
    }
  };

  return (
    <form className="wpb-youtube-form" onSubmit={handleSubmit}>
      <label className="wpb-field" htmlFor={`${formId}-youtube-url`}>
        <span className="wpb-field-label">YouTube URL</span>
        <input
          id={`${formId}-youtube-url`}
          type="url"
          placeholder="https://www.youtube.com/watch?v=…"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          aria-invalid={Boolean(urlError)}
        />
        {urlError && <p className="wpb-field-error">{urlError}</p>}
      </label>

      {parsedVideoId && (
        <div className="wpb-youtube-preview-wrap">
          <img
            src={getYouTubeThumbnailUrl(parsedVideoId)}
            alt=""
            className="wpb-youtube-thumb"
          />
          <WorkoutYouTubeEmbed videoId={parsedVideoId} title="YouTube 미리보기" />
        </div>
      )}

      <label className="wpb-field" htmlFor={`${formId}-yt-title`}>
        <span className="wpb-field-label">제목</span>
        <input
          id={`${formId}-yt-title`}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>

      <label className="wpb-field" htmlFor={`${formId}-yt-desc`}>
        <span className="wpb-field-label">설명</span>
        <textarea
          id={`${formId}-yt-desc`}
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>

      <label className="wpb-field" htmlFor={`${formId}-yt-tags`}>
        <span className="wpb-field-label">태그 (쉼표 구분)</span>
        <input
          id={`${formId}-yt-tags`}
          type="text"
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
        />
      </label>

      <fieldset className="wpb-field wpb-field--plain">
        <legend className="wpb-field-label">운동 부위</legend>
        <div className="wpb-body-part-options">
          {VIDEO_BODY_PART_OPTIONS.map((part) => (
            <label key={part} className="wpb-body-part-option">
              <input
                type="checkbox"
                checked={bodyParts.includes(part)}
                onChange={() => toggleBodyPart(part)}
              />
              <span>{part}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="wpb-field" htmlFor={`${formId}-yt-difficulty`}>
        <span className="wpb-field-label">난이도</span>
        <select
          id={`${formId}-yt-difficulty`}
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as WorkoutDifficulty | '')}
        >
          <option value="">선택</option>
          {DIFFICULTY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label className="wpb-field" htmlFor={`${formId}-yt-duration`}>
        <span className="wpb-field-label">예상 길이 (초)</span>
        <input
          id={`${formId}-yt-duration`}
          type="number"
          min={1}
          value={durationSec}
          onChange={(e) => setDurationSec(Number.parseInt(e.target.value, 10) || 0)}
        />
        <p className="wpb-field-hint">
          YouTube API로 정확한 길이를 가져오지 않습니다. 프로그램 타이머에 사용됩니다.
        </p>
      </label>

      <label className="wpb-field wpb-filter-repeatable">
        <input
          type="checkbox"
          checked={isLoopable}
          onChange={(e) => setIsLoopable(e.target.checked)}
        />
        <span>루프 가능</span>
      </label>

      <label className="wpb-field" htmlFor={`${formId}-yt-visibility`}>
        <span className="wpb-field-label">공개 범위</span>
        <select
          id={`${formId}-yt-visibility`}
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as UploadedVideoVisibility)}
        >
          {VISIBILITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label className="wpb-field wpb-filter-repeatable">
        <input
          type="checkbox"
          checked={isPremium}
          onChange={(e) => setIsPremium(e.target.checked)}
        />
        <span>프리미엄</span>
      </label>

      {formError && <p className="wpb-field-error">{formError}</p>}

      <footer className="wpb-modal-footer">
        <button type="button" className="wpb-btn wpb-btn-ghost" onClick={onCancel}>
          취소
        </button>
        <button type="submit" className="wpb-btn wpb-btn-primary">
          유튜브 영상 등록
        </button>
      </footer>
    </form>
  );
}
