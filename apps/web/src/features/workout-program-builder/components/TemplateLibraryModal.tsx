import { useEffect, useState } from 'react';
import type { WorkoutProgramTemplate } from '../types/workoutProgramBuilder.types';
import { formatDuration } from '../utils/durationUtils';
import { refreshTemplatesFromApi } from '../repositories/programTemplateRepository';
import { isPublicReviewPending, VISIBILITY_LABEL } from '../utils/visibilityUtils';

function formatUpdatedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

interface TemplateLibraryModalProps {
  isOpen: boolean;
  activeTemplateId: string | null;
  onClose: () => void;
  onLoad: (templateId: string) => void;
  onCopy: (templateId: string) => void;
  onDelete: (templateId: string) => void;
}

export function TemplateLibraryModal({
  isOpen,
  activeTemplateId,
  onClose,
  onLoad,
  onCopy,
  onDelete,
}: TemplateLibraryModalProps) {
  const [templates, setTemplates] = useState<WorkoutProgramTemplate[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    void refreshTemplatesFromApi().then(setTemplates);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="wpb-modal-backdrop" role="presentation" onClick={onClose}>
      <section
        className="wpb-template-library-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wpb-template-library-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="wpb-template-library-header">
          <h2 id="wpb-template-library-title">저장된 템플릿</h2>
          <button type="button" className="wpb-icon-btn" onClick={onClose} aria-label="닫기">
            ✕
          </button>
        </header>

        {templates.length === 0 ? (
          <div className="wpb-template-library-empty">
            <p className="wpb-empty-title">저장된 템플릿이 없습니다</p>
            <p className="wpb-empty-desc">
              프로그램을 구성한 뒤 하단의 「템플릿 저장」으로 첫 템플릿을 만들어 보세요.
            </p>
          </div>
        ) : (
          <ul className="wpb-template-library-list">
            {templates.map((template) => (
              <li
                key={template.id}
                className={`wpb-template-card${template.id === activeTemplateId ? ' is-active' : ''}`}
              >
                <div className="wpb-template-card-main">
                  <h3>
                    {template.title}
                    {isPublicReviewPending(template.visibility) && (
                      <span className="wpb-visibility-badge wpb-visibility-badge--pending">
                        승인 대기
                      </span>
                    )}
                  </h3>
                  <p className="wpb-template-card-meta">
                    {formatDuration(template.totalDurationSec)} · 블록 {template.blocks.length}개
                  </p>
                  {template.tags.length > 0 && (
                    <p className="wpb-template-card-tags">{template.tags.join(' · ')}</p>
                  )}
                  <p className="wpb-template-card-updated">
                    수정 {formatUpdatedAt(template.updatedAt)} ·{' '}
                    {VISIBILITY_LABEL[template.visibility]}
                  </p>
                </div>
                <div className="wpb-template-card-actions">
                  <button
                    type="button"
                    className="wpb-btn wpb-btn-ghost wpb-btn-sm"
                    onClick={() => onLoad(template.id)}
                  >
                    불러오기
                  </button>
                  <button
                    type="button"
                    className="wpb-btn wpb-btn-ghost wpb-btn-sm"
                    onClick={() => onCopy(template.id)}
                  >
                    복사
                  </button>
                  <button
                    type="button"
                    className="wpb-btn wpb-btn-ghost wpb-btn-sm wpb-btn-danger-text"
                    onClick={() => onDelete(template.id)}
                  >
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
