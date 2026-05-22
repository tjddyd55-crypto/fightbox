import { useCallback, useEffect, useState } from 'react';
import type { WorkoutProgramTemplate } from '../types/workoutProgramBuilder.types';
import { formatDuration } from '../utils/durationUtils';
import {
  approvePublicTemplate,
  listPublicTemplateSubmissions,
  refreshTemplatesFromApi,
  rejectPublicTemplate,
} from '../repositories/programTemplateRepository';
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

type LibraryTab = 'saved' | 'pending-review';

interface TemplateLibraryModalProps {
  isOpen: boolean;
  activeTemplateId: string | null;
  onClose: () => void;
  onLoad: (templateId: string) => void;
  onCopy: (templateId: string) => void;
  onDelete: (templateId: string) => void;
  onNotify?: (message: string) => void;
  showReviewTab?: boolean;
  canDeleteTemplates?: boolean;
}

export function TemplateLibraryModal({
  isOpen,
  activeTemplateId,
  onClose,
  onLoad,
  onCopy,
  onDelete,
  onNotify,
  showReviewTab = false,
  canDeleteTemplates = true,
}: TemplateLibraryModalProps) {
  const [activeTab, setActiveTab] = useState<LibraryTab>('saved');
  const [templates, setTemplates] = useState<WorkoutProgramTemplate[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<WorkoutProgramTemplate[]>([]);
  const [isReviewBusy, setIsReviewBusy] = useState(false);

  const loadSavedTemplates = useCallback(async () => {
    const next = await refreshTemplatesFromApi();
    setTemplates(next);
  }, []);

  const loadPendingSubmissions = useCallback(async () => {
    const next = await listPublicTemplateSubmissions();
    setPendingSubmissions(next);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    void loadSavedTemplates();
    void loadPendingSubmissions();
  }, [isOpen, loadSavedTemplates, loadPendingSubmissions]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const notify = (message: string) => {
    onNotify?.(message);
  };

  const handleApprove = async (templateId: string) => {
    if (isReviewBusy) return;
    const target = pendingSubmissions.find((item) => item.id === templateId);
    if (!target) return;
    const confirmed = window.confirm(`「${target.title}」 템플릿을 공용 라이브러리에 승인할까요?`);
    if (!confirmed) return;

    setIsReviewBusy(true);
    try {
      const updated = await approvePublicTemplate(templateId);
      if (!updated) {
        notify('승인에 실패했습니다.');
        return;
      }
      notify(`「${updated.title}」이(가) 공용 라이브러리에 승인되었습니다.`);
      await Promise.all([loadSavedTemplates(), loadPendingSubmissions()]);
    } finally {
      setIsReviewBusy(false);
    }
  };

  const handleReject = async (templateId: string) => {
    if (isReviewBusy) return;
    const target = pendingSubmissions.find((item) => item.id === templateId);
    if (!target) return;
    const reason = window.prompt(`「${target.title}」 반려 사유를 입력하세요.`);
    if (reason === null) return;
    if (!reason.trim()) {
      notify('반려 사유를 입력해 주세요.');
      return;
    }

    setIsReviewBusy(true);
    try {
      const updated = await rejectPublicTemplate(templateId, reason.trim());
      if (!updated) {
        notify('반려 처리에 실패했습니다.');
        return;
      }
      notify(`「${updated.title}」 신청이 반려되었습니다.`);
      await Promise.all([loadSavedTemplates(), loadPendingSubmissions()]);
    } finally {
      setIsReviewBusy(false);
    }
  };

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

        <div className="wpb-template-library-tabs" role="tablist" aria-label="템플릿 목록 탭">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'saved'}
            className={`wpb-btn wpb-btn-ghost wpb-btn-sm${activeTab === 'saved' ? ' is-active' : ''}`}
            onClick={() => setActiveTab('saved')}
          >
            내 템플릿
          </button>
          {showReviewTab && (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'pending-review'}
              className={`wpb-btn wpb-btn-ghost wpb-btn-sm${activeTab === 'pending-review' ? ' is-active' : ''}`}
              onClick={() => setActiveTab('pending-review')}
            >
              승인 대기 ({pendingSubmissions.length})
            </button>
          )}
        </div>

        {activeTab === 'saved' ? (
          templates.length === 0 ? (
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
                    {template.publicRejectionReason && (
                      <p className="wpb-template-card-tags">반려 사유: {template.publicRejectionReason}</p>
                    )}
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
                      disabled={!canDeleteTemplates}
                      title={!canDeleteTemplates ? '템플릿 삭제 권한이 없습니다' : undefined}
                      onClick={() => {
                        if (!canDeleteTemplates) {
                          notify('템플릿 삭제 권한이 없습니다.');
                          return;
                        }
                        onDelete(template.id);
                      }}
                    >
                      삭제
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )
        ) : pendingSubmissions.length === 0 ? (
          <div className="wpb-template-library-empty">
            <p className="wpb-empty-title">승인 대기 템플릿이 없습니다</p>
            <p className="wpb-empty-desc">
              demo admin MVP — 인증 없이 모든 사용자가 승인/반려할 수 있습니다.
            </p>
          </div>
        ) : (
          <ul className="wpb-template-library-list">
            {pendingSubmissions.map((template) => (
              <li key={template.id} className="wpb-template-card">
                <div className="wpb-template-card-main">
                  <h3>
                    {template.title}
                    <span className="wpb-visibility-badge wpb-visibility-badge--pending">
                      승인 대기
                    </span>
                  </h3>
                  {template.description && (
                    <p className="wpb-template-card-meta">{template.description}</p>
                  )}
                  <p className="wpb-template-card-meta">
                    {formatDuration(template.totalDurationSec)} · 블록 {template.blocks.length}개
                  </p>
                  {template.tags.length > 0 && (
                    <p className="wpb-template-card-tags">{template.tags.join(' · ')}</p>
                  )}
                  <p className="wpb-template-card-updated">
                    신청 {formatUpdatedAt(template.updatedAt)}
                  </p>
                </div>
                <div className="wpb-template-card-actions">
                  <button
                    type="button"
                    className="wpb-btn wpb-btn-primary wpb-btn-sm"
                    disabled={isReviewBusy}
                    onClick={() => void handleApprove(template.id)}
                  >
                    승인
                  </button>
                  <button
                    type="button"
                    className="wpb-btn wpb-btn-ghost wpb-btn-sm wpb-btn-danger-text"
                    disabled={isReviewBusy}
                    onClick={() => void handleReject(template.id)}
                  >
                    반려
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
