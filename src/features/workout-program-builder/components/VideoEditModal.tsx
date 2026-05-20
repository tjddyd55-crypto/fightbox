import { useEffect, useId, useState } from 'react';
import { VIDEO_BODY_PART_OPTIONS } from '../constants/builderConstants';
import type {
  UpdateWorkoutVideoInput,
  UploadedVideoVisibility,
  WorkoutDifficulty,
  WorkoutVideo,
} from '../types/workoutProgramBuilder.types';
import {
  buildUpdateVideoInput,
  validateVideoEditForm,
  type VideoEditFormValues,
} from '../utils/videoUploadUtils';

interface VideoEditModalProps {
  video: WorkoutVideo | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (videoId: string, input: UpdateWorkoutVideoInput) => boolean;
}

const DIFFICULTY_OPTIONS: { value: WorkoutDifficulty; label: string }[] = [
  { value: 'beginner', label: '초급' },
  { value: 'intermediate', label: '중급' },
  { value: 'advanced', label: '고급' },
];

const VISIBILITY_OPTIONS: { value: UploadedVideoVisibility; label: string }[] = [
  { value: 'private', label: '비공개 (나만)' },
  { value: 'gym_only', label: '체육관 전용' },
];

function mapSourceTypeToVisibility(
  sourceType: WorkoutVideo['sourceType'],
): UploadedVideoVisibility {
  return sourceType === 'gym' ? 'gym_only' : 'private';
}

function formValuesFromVideo(video: WorkoutVideo): VideoEditFormValues {
  return {
    title: video.title,
    description: video.description ?? '',
    tagsText: video.tags.join(', '),
    bodyParts: [...video.bodyParts],
    difficulty: video.difficulty,
    durationSec: video.durationSec,
  };
}

export function VideoEditModal({ video, isOpen, onClose, onSubmit }: VideoEditModalProps) {
  const formId = useId();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [bodyParts, setBodyParts] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState<WorkoutDifficulty | ''>('');
  const [durationSec, setDurationSec] = useState(0);
  const [isLoopable, setIsLoopable] = useState(false);
  const [visibility, setVisibility] = useState<UploadedVideoVisibility>('gym_only');
  const [isPremium, setIsPremium] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof VideoEditFormValues | 'form', string>>
  >({});

  useEffect(() => {
    if (!isOpen || !video) return;
    const values = formValuesFromVideo(video);
    setTitle(values.title);
    setDescription(values.description);
    setTagsText(values.tagsText);
    setBodyParts(values.bodyParts);
    setDifficulty(values.difficulty);
    setDurationSec(values.durationSec);
    setIsLoopable(video.isLoopable);
    setVisibility(mapSourceTypeToVisibility(video.sourceType));
    setIsPremium(Boolean(video.isPremium));
    setFieldErrors({});
  }, [isOpen, video]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const toggleBodyPart = (part: string) => {
    setBodyParts((prev) =>
      prev.includes(part) ? prev.filter((item) => item !== part) : [...prev, part],
    );
    setFieldErrors((current) => ({ ...current, bodyParts: undefined }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!video) return;

    const values: VideoEditFormValues = {
      title,
      description,
      tagsText,
      bodyParts,
      difficulty,
      durationSec,
    };

    const validation = validateVideoEditForm(values);
    if (!validation.isValid) {
      setFieldErrors(validation.fieldErrors);
      return;
    }

    const input = buildUpdateVideoInput(values, {
      visibility,
      isLoopable,
      isPremium,
    });

    if (!input) {
      setFieldErrors({ form: '수정 정보를 확인할 수 없습니다.' });
      return;
    }

    const ok = onSubmit(video.id, input);
    if (!ok) {
      setFieldErrors({ form: '영상 수정에 실패했습니다. 다시 시도해 주세요.' });
    }
  };

  if (!isOpen || !video) return null;

  const titleFieldId = `${formId}-title`;
  const descriptionFieldId = `${formId}-description`;
  const tagsFieldId = `${formId}-tags`;
  const durationFieldId = `${formId}-duration`;
  const fileName = video.uploadMeta?.originalFileName ?? '—';

  return (
    <div className="wpb-modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="wpb-video-upload-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wpb-video-edit-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="wpb-template-library-header">
          <h2 id="wpb-video-edit-modal-title">영상 수정</h2>
          <button type="button" className="wpb-icon-btn" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </header>

        <form className="wpb-form wpb-video-upload-form" onSubmit={handleSubmit}>
          {fieldErrors.form && (
            <p className="wpb-form-error-banner" role="alert">
              {fieldErrors.form}
            </p>
          )}

          <p className="wpb-video-upload-notice">
            파일은 수정할 수 없습니다. 등록 파일: <strong>{fileName}</strong>
          </p>

          <label className="wpb-field" htmlFor={titleFieldId}>
            <span className="wpb-field-label">제목</span>
            <input
              id={titleFieldId}
              type="text"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setFieldErrors((prev) => ({ ...prev, title: undefined }));
              }}
              aria-invalid={Boolean(fieldErrors.title)}
            />
            {fieldErrors.title && <p className="wpb-field-error">{fieldErrors.title}</p>}
          </label>

          <label className="wpb-field" htmlFor={descriptionFieldId}>
            <span className="wpb-field-label">설명</span>
            <textarea
              id={descriptionFieldId}
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>

          <label className="wpb-field" htmlFor={tagsFieldId}>
            <span className="wpb-field-label">태그 (쉼표 구분)</span>
            <input
              id={tagsFieldId}
              type="text"
              value={tagsText}
              onChange={(event) => {
                setTagsText(event.target.value);
                setFieldErrors((prev) => ({ ...prev, tagsText: undefined }));
              }}
              aria-invalid={Boolean(fieldErrors.tagsText)}
            />
            {fieldErrors.tagsText && <p className="wpb-field-error">{fieldErrors.tagsText}</p>}
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
            {fieldErrors.bodyParts && (
              <p className="wpb-field-error">{fieldErrors.bodyParts}</p>
            )}
          </fieldset>

          <label className="wpb-field" htmlFor={`${formId}-difficulty`}>
            <span className="wpb-field-label">난이도</span>
            <select
              id={`${formId}-difficulty`}
              value={difficulty}
              onChange={(event) => {
                setDifficulty(event.target.value as WorkoutDifficulty | '');
                setFieldErrors((prev) => ({ ...prev, difficulty: undefined }));
              }}
              aria-invalid={Boolean(fieldErrors.difficulty)}
            >
              <option value="">선택</option>
              {DIFFICULTY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {fieldErrors.difficulty && (
              <p className="wpb-field-error">{fieldErrors.difficulty}</p>
            )}
          </label>

          <label className="wpb-field" htmlFor={durationFieldId}>
            <span className="wpb-field-label">길이 (초)</span>
            <input
              id={durationFieldId}
              type="number"
              min={1}
              step={1}
              value={durationSec > 0 ? durationSec : ''}
              onChange={(event) => {
                const next = Number.parseInt(event.target.value, 10);
                setDurationSec(Number.isFinite(next) ? next : 0);
                setFieldErrors((prev) => ({ ...prev, durationSec: undefined }));
              }}
              aria-invalid={Boolean(fieldErrors.durationSec)}
            />
            {fieldErrors.durationSec && (
              <p className="wpb-field-error">{fieldErrors.durationSec}</p>
            )}
          </label>

          <label className="wpb-field wpb-filter-repeatable" htmlFor={`${formId}-loopable`}>
            <input
              id={`${formId}-loopable`}
              type="checkbox"
              checked={isLoopable}
              onChange={(event) => setIsLoopable(event.target.checked)}
            />
            <span>반복 가능 영상</span>
          </label>

          <label className="wpb-field" htmlFor={`${formId}-visibility`}>
            <span className="wpb-field-label">공개 범위</span>
            <select
              id={`${formId}-visibility`}
              value={visibility}
              onChange={(event) =>
                setVisibility(event.target.value as UploadedVideoVisibility)
              }
            >
              {VISIBILITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="wpb-field wpb-filter-repeatable" htmlFor={`${formId}-premium`}>
            <input
              id={`${formId}-premium`}
              type="checkbox"
              checked={isPremium}
              onChange={(event) => setIsPremium(event.target.checked)}
            />
            <span>프리미엄 영상 (표시만, 결제/차감 없음)</span>
          </label>

          <footer className="wpb-video-upload-form-footer">
            <button type="button" className="wpb-btn wpb-btn-ghost" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="wpb-btn wpb-btn-primary">
              저장
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
