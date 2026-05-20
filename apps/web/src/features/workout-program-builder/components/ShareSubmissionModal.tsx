import { useEffect, useState } from 'react';
import type {
  PublicShareSubmissionPayload,
  WorkoutProgramTemplate,
} from '../types/workoutProgramBuilder.types';

interface ShareSubmissionModalProps {
  isOpen: boolean;
  template: WorkoutProgramTemplate | null;
  onClose: () => void;
  onSubmit: (payload: PublicShareSubmissionPayload) => void;
}

export function ShareSubmissionModal({
  isOpen,
  template,
  onClose,
  onSubmit,
}: ShareSubmissionModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsText, setTagsText] = useState('');

  useEffect(() => {
    if (!isOpen || !template) return;
    setTitle(template.title);
    setDescription(template.description ?? '');
    setTagsText(template.tags.join(', '));
  }, [isOpen, template]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !template) return null;

  const handleSubmit = () => {
    const tags = tagsText
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      tags,
    });
  };

  return (
    <div className="wpb-modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="wpb-share-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wpb-share-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="wpb-template-library-header">
          <h2 id="wpb-share-modal-title">공용 라이브러리 신청</h2>
          <button type="button" className="wpb-icon-btn" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </header>

        <form
          className="wpb-form wpb-share-form"
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <label className="wpb-field" htmlFor="share-title">
            <span className="wpb-field-label">제목</span>
            <input
              id="share-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </label>
          <label className="wpb-field" htmlFor="share-description">
            <span className="wpb-field-label">설명</span>
            <textarea
              id="share-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <label className="wpb-field" htmlFor="share-tags">
            <span className="wpb-field-label">태그 (쉼표 구분)</span>
            <input
              id="share-tags"
              type="text"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
            />
          </label>
          <p className="wpb-share-notice">
            저작권·초상권·운동 안전성 검토 후 승인됩니다. 제출 후 상태는 「승인 대기」로
            표시됩니다.
          </p>
          <footer className="wpb-share-form-footer">
            <button type="button" className="wpb-btn wpb-btn-ghost" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="wpb-btn wpb-btn-primary">
              공용 신청 제출
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

