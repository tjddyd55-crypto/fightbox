import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { VIDEO_BODY_PART_OPTIONS } from '../constants/builderConstants';
import {
  getUploadStatusLabel,
  requestPresignedUpload,
  uploadGeneratedThumbnail,
  uploadVideoFile,
} from '../services/videoUploadService';
import type {
  CreateWorkoutVideoInput,
  UploadedVideoVisibility,
  WorkoutDifficulty,
} from '../types/workoutProgramBuilder.types';
import type { VideoUploadStatus } from '../types/videoUpload.types';
import {
  buildCreateVideoInput,
  formatFileSizeMb,
  readVideoDurationFromFile,
  validateVideoUploadForm,
  type VideoUploadFormValues,
} from '../utils/videoUploadUtils';
import {
  generateVideoThumbnailFromFile,
  type GeneratedVideoThumbnail,
} from '../utils/videoThumbnailUtils';

interface VideoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (input: CreateWorkoutVideoInput) => boolean;
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

const INITIAL_FORM: Omit<VideoUploadFormValues, 'file'> = {
  title: '',
  description: '',
  tagsText: '',
  bodyParts: [],
  difficulty: '',
  durationSec: 0,
};

export function VideoUploadModal({ isOpen, onClose, onSubmit }: VideoUploadModalProps) {
  const formId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const thumbnailObjectUrlRef = useRef<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState(INITIAL_FORM.title);
  const [description, setDescription] = useState(INITIAL_FORM.description);
  const [tagsText, setTagsText] = useState(INITIAL_FORM.tagsText);
  const [bodyParts, setBodyParts] = useState<string[]>(INITIAL_FORM.bodyParts);
  const [difficulty, setDifficulty] = useState<WorkoutDifficulty | ''>(INITIAL_FORM.difficulty);
  const [durationSec, setDurationSec] = useState(INITIAL_FORM.durationSec);
  const [isLoopable, setIsLoopable] = useState(false);
  const [visibility, setVisibility] = useState<UploadedVideoVisibility>('gym_only');
  const [isPremium, setIsPremium] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof VideoUploadFormValues | 'form', string>>
  >({});
  const [isReadingDuration, setIsReadingDuration] = useState(false);
  const [durationHint, setDurationHint] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<VideoUploadStatus>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const isUploadBusy =
    uploadStatus === 'generating-thumbnail' ||
    uploadStatus === 'preparing' ||
    uploadStatus === 'uploading' ||
    uploadStatus === 'uploading-thumbnail' ||
    uploadStatus === 'processing';

  const revokePreviewUrl = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setPreviewUrl(null);
  }, []);

  const revokeThumbnailObjectUrl = useCallback(() => {
    if (thumbnailObjectUrlRef.current) {
      URL.revokeObjectURL(thumbnailObjectUrlRef.current);
      thumbnailObjectUrlRef.current = null;
    }
  }, []);

  const resetForm = useCallback(() => {
    revokePreviewUrl();
    revokeThumbnailObjectUrl();
    setSelectedFile(null);
    setTitle(INITIAL_FORM.title);
    setDescription(INITIAL_FORM.description);
    setTagsText(INITIAL_FORM.tagsText);
    setBodyParts(INITIAL_FORM.bodyParts);
    setDifficulty(INITIAL_FORM.difficulty);
    setDurationSec(INITIAL_FORM.durationSec);
    setIsLoopable(false);
    setVisibility('gym_only');
    setIsPremium(false);
    setFieldErrors({});
    setIsReadingDuration(false);
    setDurationHint(null);
    setUploadStatus('idle');
    setUploadProgress(0);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [revokePreviewUrl, revokeThumbnailObjectUrl]);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
      if (thumbnailObjectUrlRef.current) {
        URL.revokeObjectURL(thumbnailObjectUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    revokePreviewUrl();
    setSelectedFile(file);
    setFieldErrors((prev) => ({ ...prev, file: undefined, form: undefined }));
    setDurationHint(null);

    if (!file) {
      setDurationSec(0);
      return;
    }

    if (!title.trim()) {
      const baseName = file.name.replace(/\.[^.]+$/, '');
      setTitle(baseName);
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    previewUrlRef.current = nextPreviewUrl;
    setPreviewUrl(nextPreviewUrl);

    setIsReadingDuration(true);
    try {
      const duration = await readVideoDurationFromFile(file);
      setDurationSec(duration);
      setDurationHint('파일에서 길이를 자동으로 불러왔습니다.');
    } catch {
      setDurationHint('길이를 자동으로 읽지 못했습니다. 직접 입력해 주세요.');
    } finally {
      setIsReadingDuration(false);
    }
  };

  const toggleBodyPart = (part: string) => {
    setBodyParts((prev) =>
      prev.includes(part) ? prev.filter((item) => item !== part) : [...prev, part],
    );
    setFieldErrors((current) => ({ ...current, bodyParts: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const values: VideoUploadFormValues = {
      file: selectedFile,
      title,
      description,
      tagsText,
      bodyParts,
      difficulty,
      durationSec,
    };

    const validation = validateVideoUploadForm(values);
    if (!validation.isValid) {
      setFieldErrors(validation.fieldErrors);
      return;
    }

    const input = buildCreateVideoInput(values, {
      visibility,
      isLoopable,
      isPremium,
    });

    if (!input || !selectedFile) {
      setFieldErrors({ form: '등록 정보를 확인할 수 없습니다.' });
      return;
    }

    setUploadError(null);
    setFieldErrors({});
    setUploadStatus('generating-thumbnail');
    setUploadProgress(0);

    let generatedThumbnail: GeneratedVideoThumbnail | null = null;

    try {
      try {
        generatedThumbnail = await generateVideoThumbnailFromFile(selectedFile);
        thumbnailObjectUrlRef.current = generatedThumbnail.objectUrl;
      } catch (error) {
        console.warn('[workout-builder] thumbnail generation failed', error);
      }

      setUploadStatus('preparing');
      const presigned = await requestPresignedUpload({
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        contentType: selectedFile.type || 'video/*',
        assetType: 'video',
      });

      setUploadStatus('uploading');
      const uploadResult = await uploadVideoFile({
        file: selectedFile,
        presigned,
        onProgress: (percent) => setUploadProgress(Math.round(percent * 0.88)),
      });

      let finalUploadResult = uploadResult;
      if (generatedThumbnail) {
        setUploadStatus('uploading-thumbnail');
        try {
          const thumbnailUrl = await uploadGeneratedThumbnail({
            blob: generatedThumbnail.blob,
            fileName: generatedThumbnail.fileName,
            contentType: generatedThumbnail.contentType,
            onProgress: (percent) => setUploadProgress(88 + Math.round(percent * 0.1)),
          });
          if (thumbnailUrl) {
            finalUploadResult = { ...uploadResult, thumbnailUrl };
          }
        } catch (error) {
          console.warn('[workout-builder] thumbnail upload failed', error);
        } finally {
          revokeThumbnailObjectUrl();
        }
      }

      setUploadStatus('processing');
      setUploadProgress(99);
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, 400);
      });

      setUploadStatus('completed');
      setUploadProgress(100);
      const ok = onSubmit({ ...input, uploadResult: finalUploadResult });
      if (!ok) {
        setUploadStatus('failed');
        setUploadError('영상 등록에 실패했습니다. 다시 시도해 주세요.');
      }
    } catch (error) {
      revokeThumbnailObjectUrl();
      setUploadStatus('failed');
      const detail =
        error instanceof Error && error.message.trim()
          ? error.message.trim()
          : '업로드 중 알 수 없는 오류가 발생했습니다.';
      setUploadError(detail);
    }
  };

  const handleClose = () => {
    if (isUploadBusy) return;
    onClose();
  };

  if (!isOpen) return null;

  const fileFieldId = `${formId}-file`;
  const titleFieldId = `${formId}-title`;
  const descriptionFieldId = `${formId}-description`;
  const tagsFieldId = `${formId}-tags`;
  const durationFieldId = `${formId}-duration`;
  const statusLabel =
    uploadStatus !== 'idle' ? getUploadStatusLabel(uploadStatus, uploadProgress) : '';

  return (
    <div className="wpb-modal-backdrop" role="presentation" onClick={handleClose}>
      <section
        className="wpb-video-upload-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wpb-video-upload-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="wpb-template-library-header">
          <h2 id="wpb-video-upload-modal-title">영상 등록</h2>
          <button
            type="button"
            className="wpb-icon-btn"
            onClick={handleClose}
            disabled={isUploadBusy}
            aria-label="닫기"
          >
            ✕
          </button>
        </header>

        <form className="wpb-form wpb-video-upload-form" onSubmit={handleSubmit}>
          {fieldErrors.form && (
            <p className="wpb-form-error-banner" role="alert">
              {fieldErrors.form}
            </p>
          )}

          <div className="wpb-video-upload-grid">
            <div className="wpb-video-upload-col">
              <div className="wpb-field">
                <label className="wpb-field-label" htmlFor={fileFieldId}>
                  영상 파일
                </label>
                <input
                  ref={fileInputRef}
                  id={fileFieldId}
                  type="file"
                  accept="video/*"
                  className="wpb-file-input"
                  onChange={handleFileChange}
                  aria-describedby={fieldErrors.file ? `${fileFieldId}-error` : undefined}
                  aria-invalid={Boolean(fieldErrors.file)}
                />
                {fieldErrors.file && (
                  <p id={`${fileFieldId}-error`} className="wpb-field-error">
                    {fieldErrors.file}
                  </p>
                )}
              </div>

              {selectedFile && (
                <div className="wpb-video-upload-file-meta" aria-live="polite">
                  <p>
                    <span className="wpb-meta-label">파일명</span>
                    <span>{selectedFile.name}</span>
                  </p>
                  <p>
                    <span className="wpb-meta-label">크기</span>
                    <span>{formatFileSizeMb(selectedFile.size)}</span>
                  </p>
                  <p>
                    <span className="wpb-meta-label">형식</span>
                    <span>{selectedFile.type || 'video/*'}</span>
                  </p>
                </div>
              )}

              {previewUrl && (
                <div className="wpb-video-upload-preview">
                  <video src={previewUrl} controls muted playsInline className="wpb-video-upload-player" />
                </div>
              )}

              <p className="wpb-video-upload-notice">
                미리보기는 로컬에서만 사용됩니다. 등록 시 mock 업로드 후 원격 메타데이터만
                저장됩니다.
              </p>
            </div>

            <div className="wpb-video-upload-col">
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
                  aria-describedby={fieldErrors.title ? `${titleFieldId}-error` : undefined}
                />
                {fieldErrors.title && (
                  <p id={`${titleFieldId}-error`} className="wpb-field-error">
                    {fieldErrors.title}
                  </p>
                )}
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
                  placeholder="준비운동, 하체, 초급"
                  value={tagsText}
                  onChange={(event) => {
                    setTagsText(event.target.value);
                    setFieldErrors((prev) => ({ ...prev, tagsText: undefined }));
                  }}
                  aria-invalid={Boolean(fieldErrors.tagsText)}
                  aria-describedby={fieldErrors.tagsText ? `${tagsFieldId}-error` : undefined}
                />
                {fieldErrors.tagsText && (
                  <p id={`${tagsFieldId}-error`} className="wpb-field-error">
                    {fieldErrors.tagsText}
                  </p>
                )}
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
                    setDurationHint(null);
                  }}
                  disabled={isReadingDuration}
                  aria-invalid={Boolean(fieldErrors.durationSec)}
                />
                {durationHint && <p className="wpb-field-hint">{durationHint}</p>}
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
            </div>
          </div>

          {uploadStatus !== 'idle' && (
            <div className="wpb-video-upload-progress" aria-live="polite">
              <p className="wpb-video-upload-progress-label" role="status">
                {statusLabel}
              </p>
              <div
                className="wpb-video-upload-progress-track"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={uploadProgress}
                aria-label="업로드 진행률"
              >
                <span
                  className="wpb-video-upload-progress-bar"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              {uploadError && (
                <div className="wpb-form-error-banner wpb-upload-error-banner" role="alert">
                  <strong>업로드 실패</strong>
                  <p className="wpb-upload-error-detail">{uploadError}</p>
                </div>
              )}
            </div>
          )}

          <footer className="wpb-video-upload-form-footer">
            <button
              type="button"
              className="wpb-btn wpb-btn-ghost"
              onClick={handleClose}
              disabled={isUploadBusy}
            >
              취소
            </button>
            <button
              type="submit"
              className="wpb-btn wpb-btn-primary"
              disabled={isReadingDuration || isUploadBusy}
            >
              {isUploadBusy ? '업로드 중…' : '영상 등록'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
