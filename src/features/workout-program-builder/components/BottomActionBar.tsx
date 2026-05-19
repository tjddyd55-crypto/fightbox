import { formatDuration } from '../utils/durationUtils';

interface BottomActionBarProps {
  totalDurationSec: number;
  onPreview: () => void;
  onSaveTemplate: () => void;
  onCopySave: () => void;
  onTestPlay: () => void;
}

export function BottomActionBar({
  totalDurationSec,
  onPreview,
  onSaveTemplate,
  onCopySave,
  onTestPlay,
}: BottomActionBarProps) {
  return (
    <footer className="wpb-bottom-bar">
      <p className="wpb-total-time">
        총 프로그램 시간
        <strong>{formatDuration(totalDurationSec)}</strong>
      </p>
      <section className="wpb-bottom-actions">
        <button type="button" className="wpb-btn wpb-btn-ghost" onClick={onPreview}>
          구간 미리보기
        </button>
        <button type="button" className="wpb-btn wpb-btn-primary" onClick={onSaveTemplate}>
          템플릿 저장
        </button>
        <button type="button" className="wpb-btn wpb-btn-ghost" onClick={onCopySave}>
          복사 저장
        </button>
        <button type="button" className="wpb-btn wpb-btn-ghost" onClick={onTestPlay}>
          테스트 재생
        </button>
      </section>
    </footer>
  );
}
