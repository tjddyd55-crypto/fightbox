import { formatDuration } from '../utils/durationUtils';

interface BottomActionBarProps {
  totalDurationSec: number;
  onPreview: () => void;
  onOpenTemplateLibrary: () => void;
  onSaveTemplate: () => void;
  onCopySave: () => void;
  onTestPlay: () => void;
  onLaunchPlayer?: () => void;
  onPublicShare?: () => void;
  canSaveTemplate?: boolean;
  canCopySave?: boolean;
  canLaunchPlayer?: boolean;
}

export function BottomActionBar({
  totalDurationSec,
  onPreview,
  onOpenTemplateLibrary,
  onSaveTemplate,
  onCopySave,
  onTestPlay,
  onLaunchPlayer,
  onPublicShare,
  canSaveTemplate = true,
  canCopySave = true,
  canLaunchPlayer = false,
}: BottomActionBarProps) {
  return (
    <footer className="wpb-bottom-bar">
      <p className="wpb-total-time">
        <span className="wpb-total-label">총 프로그램 시간</span>
        <strong>{formatDuration(totalDurationSec)}</strong>
      </p>
      <section className="wpb-bottom-actions" aria-label="프로그램 액션">
        <button type="button" className="wpb-btn wpb-btn-ghost" onClick={onPreview}>
          구간 미리보기
        </button>
        <button type="button" className="wpb-btn wpb-btn-ghost" onClick={onOpenTemplateLibrary}>
          템플릿 목록
        </button>
        <button
          type="button"
          className="wpb-btn wpb-btn-ghost"
          onClick={onSaveTemplate}
          disabled={!canSaveTemplate}
          title={!canSaveTemplate ? '템플릿 저장 권한이 없습니다' : undefined}
        >
          템플릿 저장
        </button>
        <button
          type="button"
          className="wpb-btn wpb-btn-ghost"
          onClick={onCopySave}
          disabled={!canCopySave}
          title={!canCopySave ? '템플릿 생성 권한이 없습니다' : undefined}
        >
          복사 저장
        </button>
        {onPublicShare && (
          <button type="button" className="wpb-btn wpb-btn-ghost" onClick={onPublicShare}>
            공용 신청
          </button>
        )}
        {onLaunchPlayer && (
          <button
            type="button"
            className="wpb-btn wpb-btn-ghost"
            onClick={onLaunchPlayer}
            disabled={!canLaunchPlayer}
            title={!canLaunchPlayer ? '먼저 템플릿을 저장해 주세요.' : undefined}
          >
            프로그램 실행
          </button>
        )}
        <button
          type="button"
          className="wpb-btn wpb-btn-primary wpb-btn-test-play"
          onClick={onTestPlay}
        >
          테스트 재생
        </button>
      </section>
    </footer>
  );
}
