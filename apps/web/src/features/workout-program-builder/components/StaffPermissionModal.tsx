import { useCallback, useEffect, useState } from 'react';
import type {
  FightboxSessionUser,
  FightboxStaffPermissions,
  GymStaffPermissionDto,
} from '@fightbox/shared';
import { STAFF_PERMISSION_FIELD_KEYS } from '@fightbox/shared';
import {
  listStaffPermissions,
  StaffPermissionApiError,
  updateStaffPermissions,
} from '../../auth/staffPermissionApiClient';

const PERMISSION_LABELS: Record<keyof FightboxStaffPermissions, string> = {
  canUploadVideos: '영상 업로드',
  canManageVideos: '영상 관리',
  canCreateTemplates: '템플릿 생성',
  canEditTemplates: '템플릿 수정',
  canDeleteTemplates: '템플릿 삭제',
  canSubmitPublicTemplates: '공용 신청',
};

interface StaffPermissionModalProps {
  isOpen: boolean;
  managerUser: FightboxSessionUser;
  onClose: () => void;
  onNotify: (message: string) => void;
}

type DraftPermissions = Record<string, FightboxStaffPermissions>;

export function StaffPermissionModal({
  isOpen,
  managerUser,
  onClose,
  onNotify,
}: StaffPermissionModalProps) {
  const [staffList, setStaffList] = useState<GymStaffPermissionDto[]>([]);
  const [drafts, setDrafts] = useState<DraftPermissions>({});
  const [loading, setLoading] = useState(false);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadStaff = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await listStaffPermissions(managerUser);
      setStaffList(data);
      const nextDrafts: DraftPermissions = {};
      for (const row of data) {
        nextDrafts[row.userId] = { ...row.permissions };
      }
      setDrafts(nextDrafts);
    } catch (error) {
      const message =
        error instanceof StaffPermissionApiError
          ? error.message
          : '직원 권한 목록을 불러오지 못했습니다.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }, [managerUser]);

  useEffect(() => {
    if (!isOpen) return;
    void loadStaff();
  }, [isOpen, loadStaff]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleToggle = (
    userId: string,
    key: keyof FightboxStaffPermissions,
    checked: boolean,
  ) => {
    setDrafts((prev) => ({
      ...prev,
      [userId]: {
        ...(prev[userId] ?? {}),
        [key]: checked,
      } as FightboxStaffPermissions,
    }));
  };

  const handleSave = async (row: GymStaffPermissionDto) => {
    const draft = drafts[row.userId];
    if (!draft) return;

    const patch: Partial<FightboxStaffPermissions> = {};
    for (const key of STAFF_PERMISSION_FIELD_KEYS) {
      if (draft[key] !== row.permissions[key]) {
        patch[key] = draft[key];
      }
    }

    if (Object.keys(patch).length === 0) {
      onNotify('변경된 권한이 없습니다.');
      return;
    }

    setSavingUserId(row.userId);
    setErrorMessage(null);
    try {
      const updated = await updateStaffPermissions(managerUser, row.userId, patch);
      setStaffList((prev) =>
        prev.map((item) => (item.userId === updated.userId ? updated : item)),
      );
      setDrafts((prev) => ({
        ...prev,
        [updated.userId]: { ...updated.permissions },
      }));
      onNotify(`「${updated.displayName}」 권한이 저장되었습니다. 직원은 새로고침 또는 다시 로그인하면 반영됩니다.`);
    } catch (error) {
      const message =
        error instanceof StaffPermissionApiError
          ? error.message
          : '권한 저장에 실패했습니다.';
      setErrorMessage(message);
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <div className="wpb-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="wpb-template-library-modal wpb-staff-permission-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wpb-staff-permission-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="wpb-template-library-header">
          <h2 id="wpb-staff-permission-title">직원 권한 관리</h2>
          <button type="button" className="wpb-btn wpb-btn-ghost" onClick={onClose}>
            닫기
          </button>
        </header>

        <p className="wpb-staff-permission-hint">
          변경 사항은 해당 직원이 새로고침하거나 다시 로그인할 때 반영됩니다.
        </p>

        {errorMessage ? <p className="wpb-staff-permission-error">{errorMessage}</p> : null}

        {loading ? (
          <p className="wpb-template-library-empty">불러오는 중…</p>
        ) : staffList.length === 0 ? (
          <p className="wpb-template-library-empty">등록된 직원이 없습니다.</p>
        ) : (
          <ul className="wpb-staff-permission-list">
            {staffList.map((row) => {
              const draft = drafts[row.userId] ?? row.permissions;
              return (
                <li key={row.userId} className="wpb-staff-permission-row">
                  <div className="wpb-staff-permission-row-head">
                    <strong>{row.displayName}</strong>
                    <span className="wpb-staff-permission-login">{row.loginId}</span>
                  </div>
                  <div className="wpb-staff-permission-checks">
                    {STAFF_PERMISSION_FIELD_KEYS.map((key) => (
                      <label key={key} className="wpb-staff-permission-check">
                        <input
                          type="checkbox"
                          checked={draft[key]}
                          onChange={(e) => handleToggle(row.userId, key, e.target.checked)}
                        />
                        {PERMISSION_LABELS[key]}
                      </label>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="wpb-btn wpb-btn-primary"
                    disabled={savingUserId === row.userId}
                    onClick={() => void handleSave(row)}
                  >
                    {savingUserId === row.userId ? '저장 중…' : '저장'}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
