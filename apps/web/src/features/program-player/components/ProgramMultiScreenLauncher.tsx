import { buildMultiScreenPath } from '../utils/programPlayerViewUtils';

const POPUP_FEATURES = 'noopener,noreferrer,toolbar=no,menubar=no,location=no,status=no';

function openPlayerWindow(path: string, windowName: string): Window | null {
  const url = `${window.location.origin}${path}`;
  const opened = window.open(url, windowName, POPUP_FEATURES);
  if (!opened) {
    window.location.assign(path);
  }
  return opened;
}

interface ProgramMultiScreenLauncherProps {
  basePath?: string;
  allowCoachQueue?: boolean;
  compact?: boolean;
  showFullscreen?: boolean;
  onFullscreen?: () => void;
}

export function ProgramMultiScreenLauncher({
  basePath = '/program-player-demo',
  allowCoachQueue = true,
  compact = false,
  showFullscreen = false,
  onFullscreen,
}: ProgramMultiScreenLauncherProps) {
  const displayPath = buildMultiScreenPath(basePath, 'display');
  const coachPath = buildMultiScreenPath(basePath, 'coach');
  const queuePath = buildMultiScreenPath(basePath, 'queue');

  return (
    <div className={`pp-multi-launcher${compact ? ' pp-multi-launcher--compact' : ''}`}>
      <p className="pp-multi-launcher-title">멀티 모니터 실행</p>
      <div className="pp-multi-launcher-actions">
        <button
          type="button"
          className="pp-multi-btn"
          onClick={() => openPlayerWindow(displayPath, 'fightbox-display')}
        >
          표시 화면 열기
        </button>
        {allowCoachQueue && (
          <>
            <button
              type="button"
              className="pp-multi-btn"
              onClick={() => openPlayerWindow(coachPath, 'fightbox-coach')}
            >
              코치 컨트롤 열기
            </button>
            <button
              type="button"
              className="pp-multi-btn"
              onClick={() => openPlayerWindow(queuePath, 'fightbox-queue')}
            >
              순서 화면 열기
            </button>
          </>
        )}
        {showFullscreen && onFullscreen && (
          <button type="button" className="pp-multi-btn pp-multi-btn--accent" onClick={onFullscreen}>
            전체화면 실행
          </button>
        )}
      </div>
      <p className="pp-multi-launcher-hint">
        새 창을 다른 모니터로 옮겨 사용하세요. 팝업이 차단되면 현재 창에서 열립니다.
      </p>
    </div>
  );
}
