import { useCallback, useEffect, useState } from 'react';
import {
  FIGHTBOX_ROLE_LABELS,
  type AuthAuditLogDto,
  type FightboxSessionUser,
  type FightboxUserRole,
} from '@fightbox/shared';
import { AuthAuditApiError, listAuthAuditLogs } from '../../auth/authAuditApiClient';

const EVENT_TYPE_LABELS: Record<AuthAuditLogDto['eventType'], string> = {
  login_success: '로그인 성공',
  login_failed: '로그인 실패',
  login_rate_limited: '로그인 차단',
};

interface AuthAuditLogModalProps {
  isOpen: boolean;
  managerUser: FightboxSessionUser;
  onClose: () => void;
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString('ko-KR');
}

function formatRole(role: string | null): string {
  if (!role) {
    return '—';
  }
  if (role in FIGHTBOX_ROLE_LABELS) {
    return FIGHTBOX_ROLE_LABELS[role as FightboxUserRole];
  }
  return role;
}

function truncateUserAgent(userAgent: string): string {
  const trimmed = userAgent.trim();
  if (trimmed.length <= 80) {
    return trimmed || '—';
  }
  return `${trimmed.slice(0, 77)}…`;
}

export function AuthAuditLogModal({ isOpen, managerUser, onClose }: AuthAuditLogModalProps) {
  const [logs, setLogs] = useState<AuthAuditLogDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await listAuthAuditLogs(managerUser, { limit: 100 });
      setLogs(data);
    } catch (error) {
      const message =
        error instanceof AuthAuditApiError
          ? error.message
          : '감사 로그를 불러오지 못했습니다.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }, [managerUser]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    void loadLogs();
  }, [isOpen, loadLogs]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="wpb-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="wpb-template-library-modal wpb-auth-audit-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wpb-auth-audit-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="wpb-template-library-header">
          <h2 id="wpb-auth-audit-title">로그인 감사 로그</h2>
          <button type="button" className="wpb-btn wpb-btn-ghost" onClick={onClose}>
            닫기
          </button>
        </header>

        <p className="wpb-staff-permission-hint">
          로그인 성공·실패·rate limit 차단 이벤트만 기록합니다. 비밀번호와 JWT token은 저장하지
          않습니다.
        </p>

        <div className="wpb-auth-audit-toolbar">
          <button
            type="button"
            className="wpb-btn wpb-btn-primary"
            disabled={loading}
            onClick={() => void loadLogs()}
          >
            새로고침
          </button>
        </div>

        {errorMessage ? <p className="wpb-staff-permission-error">{errorMessage}</p> : null}

        {loading ? (
          <p className="wpb-template-library-empty">불러오는 중…</p>
        ) : logs.length === 0 ? (
          <p className="wpb-template-library-empty">표시할 감사 로그가 없습니다.</p>
        ) : (
          <div className="wpb-auth-audit-table-wrap">
            <table className="wpb-auth-audit-table">
              <thead>
                <tr>
                  <th scope="col">시간</th>
                  <th scope="col">이벤트</th>
                  <th scope="col">성공</th>
                  <th scope="col">loginId</th>
                  <th scope="col">role</th>
                  <th scope="col">IP</th>
                  <th scope="col">failureCode</th>
                  <th scope="col">userAgent</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((row) => (
                  <tr key={row.id}>
                    <td>{formatTimestamp(row.createdAt)}</td>
                    <td>{EVENT_TYPE_LABELS[row.eventType]}</td>
                    <td>{row.success ? 'Y' : 'N'}</td>
                    <td>{row.loginId || '—'}</td>
                    <td>{formatRole(row.role)}</td>
                    <td>{row.ipAddress || '—'}</td>
                    <td>{row.failureCode ?? '—'}</td>
                    <td title={row.userAgent}>{truncateUserAgent(row.userAgent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
