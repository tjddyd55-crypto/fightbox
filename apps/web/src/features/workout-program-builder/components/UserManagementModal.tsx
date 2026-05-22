import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  DEFAULT_STAFF_PERMISSIONS,
  FIGHTBOX_ROLE_LABELS,
  STAFF_PERMISSION_FIELD_KEYS,
  type FightboxSessionUser,
  type FightboxStaffPermissions,
  type FightboxUserRole,
  type ManagedUserDto,
  type ManagedUserStatus,
} from '@fightbox/shared';
import {
  createManagedUser,
  disableManagedUser,
  listManagedUsers,
  updateManagedUser,
  UserManagementApiError,
} from '../../auth/userManagementApiClient';

const STAFF_PERMISSION_LABELS: Record<keyof FightboxStaffPermissions, string> = {
  canUploadVideos: '영상 업로드',
  canManageVideos: '영상 관리',
  canCreateTemplates: '템플릿 생성',
  canEditTemplates: '템플릿 수정',
  canDeleteTemplates: '템플릿 삭제',
  canSubmitPublicTemplates: '공용 신청',
};

const SUPER_ADMIN_CREATABLE_ROLES: FightboxUserRole[] = [
  'super_admin',
  'gym_admin',
  'gym_staff',
  'video_creator',
];

const GYM_ADMIN_CREATABLE_ROLES: FightboxUserRole[] = ['gym_staff', 'video_creator'];

interface UserManagementModalProps {
  isOpen: boolean;
  managerUser: FightboxSessionUser;
  onClose: () => void;
  onNotify: (message: string) => void;
}

interface UserFormState {
  loginId: string;
  password: string;
  displayName: string;
  role: FightboxUserRole;
  gymId: string;
  status: ManagedUserStatus;
  staffPermissions: FightboxStaffPermissions;
}

function emptyStaffPermissions(): FightboxStaffPermissions {
  return { ...DEFAULT_STAFF_PERMISSIONS };
}

function defaultCreateForm(manager: FightboxSessionUser): UserFormState {
  const roles =
    manager.role === 'super_admin' ? SUPER_ADMIN_CREATABLE_ROLES : GYM_ADMIN_CREATABLE_ROLES;
  return {
    loginId: '',
    password: '',
    displayName: '',
    role: roles[0] ?? 'gym_staff',
    gymId: manager.gymId ?? 'demo-gym',
    status: 'active',
    staffPermissions: emptyStaffPermissions(),
  };
}

function userToEditForm(user: ManagedUserDto): UserFormState {
  return {
    loginId: user.loginId,
    password: '',
    displayName: user.displayName,
    role: user.role,
    gymId: user.gymId || 'demo-gym',
    status: user.status,
    staffPermissions: emptyStaffPermissions(),
  };
}

export function UserManagementModal({
  isOpen,
  managerUser,
  onClose,
  onNotify,
}: UserManagementModalProps) {
  const creatableRoles = useMemo(
    () =>
      managerUser.role === 'super_admin'
        ? SUPER_ADMIN_CREATABLE_ROLES
        : GYM_ADMIN_CREATABLE_ROLES,
    [managerUser.role],
  );

  const [users, setUsers] = useState<ManagedUserDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [form, setForm] = useState<UserFormState>(() => defaultCreateForm(managerUser));

  const selectedUser = users.find((u) => u.id === selectedUserId) ?? null;

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await listManagedUsers(managerUser);
      setUsers(data);
    } catch (error) {
      const message =
        error instanceof UserManagementApiError
          ? error.message
          : '사용자 목록을 불러오지 못했습니다.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }, [managerUser]);

  useEffect(() => {
    if (!isOpen) return;
    setMode('list');
    setSelectedUserId(null);
    void loadUsers();
  }, [isOpen, loadUsers]);

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

  const showStaffPermissions = form.role === 'gym_staff';
  const showGymIdField = managerUser.role === 'super_admin' && mode === 'create';

  const openCreate = () => {
    setForm(defaultCreateForm(managerUser));
    setMode('create');
    setSelectedUserId(null);
    setErrorMessage(null);
  };

  const openEdit = (user: ManagedUserDto) => {
    setForm(userToEditForm(user));
    setSelectedUserId(user.id);
    setMode('edit');
    setErrorMessage(null);
  };

  const handleCreateSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    try {
      await createManagedUser(managerUser, {
        loginId: form.loginId.trim(),
        password: form.password,
        displayName: form.displayName.trim(),
        role: form.role,
        ...(showGymIdField ? { gymId: form.gymId.trim() } : {}),
        ...(showStaffPermissions ? { staffPermissions: form.staffPermissions } : {}),
      });
      setForm((prev) => ({ ...prev, password: '' }));
      onNotify('사용자가 생성되었습니다.');
      setMode('list');
      await loadUsers();
    } catch (error) {
      const message =
        error instanceof UserManagementApiError
          ? error.message
          : '사용자 생성에 실패했습니다.';
      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedUser) return;

    setSaving(true);
    setErrorMessage(null);
    try {
      const patch: Parameters<typeof updateManagedUser>[2] = {
        displayName: form.displayName.trim(),
        role: form.role,
        status: form.status,
      };
      if (form.password.trim()) {
        patch.password = form.password;
      }
      if (showStaffPermissions) {
        patch.staffPermissions = form.staffPermissions;
      }

      await updateManagedUser(managerUser, selectedUser.id, patch);
      setForm((prev) => ({ ...prev, password: '' }));
      onNotify('사용자 정보가 저장되었습니다.');
      setMode('list');
      setSelectedUserId(null);
      await loadUsers();
    } catch (error) {
      const message =
        error instanceof UserManagementApiError
          ? error.message
          : '사용자 수정에 실패했습니다.';
      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDisable = async (user: ManagedUserDto) => {
    if (user.status === 'disabled') {
      onNotify('이미 비활성화된 사용자입니다.');
      return;
    }
    const confirmed = window.confirm(`「${user.displayName}」 계정을 비활성화할까요?`);
    if (!confirmed) return;

    setSaving(true);
    setErrorMessage(null);
    try {
      await disableManagedUser(managerUser, user.id);
      onNotify('사용자가 비활성화되었습니다.');
      if (selectedUserId === user.id) {
        setMode('list');
        setSelectedUserId(null);
      }
      await loadUsers();
    } catch (error) {
      const message =
        error instanceof UserManagementApiError
          ? error.message
          : '비활성화에 실패했습니다.';
      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="wpb-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="wpb-template-library-modal wpb-user-management-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wpb-user-management-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="wpb-template-library-header">
          <h2 id="wpb-user-management-title">사용자 관리</h2>
          <button type="button" className="wpb-btn wpb-btn-ghost" onClick={onClose}>
            닫기
          </button>
        </header>

        <p className="wpb-staff-permission-hint">
          비밀번호는 bcrypt 해시로 저장되며 API 응답에 포함되지 않습니다. 비활성화는 삭제가 아닌
          status 변경입니다. 직원 권한 모달과 중복될 수 있으며 추후 통합 예정입니다.
        </p>

        {errorMessage ? <p className="wpb-staff-permission-error">{errorMessage}</p> : null}

        {mode === 'list' ? (
          <>
            <div className="wpb-user-management-toolbar">
              <button type="button" className="wpb-btn wpb-btn-primary" onClick={openCreate}>
                신규 사용자
              </button>
            </div>

            {loading ? (
              <p className="wpb-template-library-empty">불러오는 중…</p>
            ) : users.length === 0 ? (
              <p className="wpb-template-library-empty">표시할 사용자가 없습니다.</p>
            ) : (
              <ul className="wpb-user-management-list">
                {users.map((row) => (
                  <li key={row.id} className="wpb-user-management-row">
                    <div className="wpb-user-management-row-head">
                      <strong>{row.displayName}</strong>
                      <span className="wpb-staff-permission-login">
                        {row.loginId} · {FIGHTBOX_ROLE_LABELS[row.role]}
                        {row.gymId ? ` · ${row.gymId}` : ''}
                      </span>
                      <span
                        className={
                          row.status === 'active'
                            ? 'wpb-user-management-status wpb-user-management-status--active'
                            : 'wpb-user-management-status'
                        }
                      >
                        {row.status === 'active' ? '활성' : '비활성'}
                      </span>
                    </div>
                    <div className="wpb-user-management-row-actions">
                      <button
                        type="button"
                        className="wpb-btn wpb-btn-ghost"
                        disabled={saving}
                        onClick={() => openEdit(row)}
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        className="wpb-btn wpb-btn-ghost"
                        disabled={saving || row.status === 'disabled'}
                        onClick={() => void handleDisable(row)}
                      >
                        비활성화
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <form
            className="wpb-user-management-form"
            onSubmit={(e) =>
              void (mode === 'create' ? handleCreateSubmit(e) : handleEditSubmit(e))
            }
          >
            {mode === 'create' ? (
              <div className="wpb-user-management-field">
                <label htmlFor="um-login-id">아이디</label>
                <input
                  id="um-login-id"
                  type="text"
                  autoComplete="off"
                  required
                  value={form.loginId}
                  onChange={(e) => setForm((p) => ({ ...p, loginId: e.target.value }))}
                />
              </div>
            ) : (
              <p className="wpb-user-management-readonly">
                아이디: <strong>{form.loginId}</strong>
              </p>
            )}

            <div className="wpb-user-management-field">
              <label htmlFor="um-display-name">표시 이름</label>
              <input
                id="um-display-name"
                type="text"
                required
                value={form.displayName}
                onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
              />
            </div>

            <div className="wpb-user-management-field">
              <label htmlFor="um-role">역할</label>
              <select
                id="um-role"
                value={form.role}
                onChange={(e) =>
                  setForm((p) => ({
                    ...p,
                    role: e.target.value as FightboxUserRole,
                  }))
                }
              >
                {creatableRoles.map((role) => (
                  <option key={role} value={role}>
                    {FIGHTBOX_ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </div>

            {showGymIdField ? (
              <div className="wpb-user-management-field">
                <label htmlFor="um-gym-id">체육관 ID</label>
                <input
                  id="um-gym-id"
                  type="text"
                  value={form.gymId}
                  onChange={(e) => setForm((p) => ({ ...p, gymId: e.target.value }))}
                />
              </div>
            ) : null}

            {mode === 'edit' ? (
              <div className="wpb-user-management-field">
                <label htmlFor="um-status">상태</label>
                <select
                  id="um-status"
                  value={form.status}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      status: e.target.value as ManagedUserStatus,
                    }))
                  }
                >
                  <option value="active">활성</option>
                  <option value="disabled">비활성</option>
                </select>
              </div>
            ) : null}

            <div className="wpb-user-management-field">
              <label htmlFor="um-password">
                {mode === 'create' ? '비밀번호 (최소 8자)' : '비밀번호 (변경 시만 입력)'}
              </label>
              <input
                id="um-password"
                type="password"
                autoComplete="new-password"
                required={mode === 'create'}
                minLength={mode === 'create' ? 8 : undefined}
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              />
            </div>

            {showStaffPermissions ? (
              <fieldset className="wpb-user-management-permissions">
                <legend>직원 권한 (gym_staff)</legend>
                <div className="wpb-staff-permission-checks">
                  {STAFF_PERMISSION_FIELD_KEYS.map((key) => (
                    <label key={key} className="wpb-staff-permission-check">
                      <input
                        type="checkbox"
                        checked={form.staffPermissions[key]}
                        onChange={(e) =>
                          setForm((p) => ({
                            ...p,
                            staffPermissions: {
                              ...p.staffPermissions,
                              [key]: e.target.checked,
                            },
                          }))
                        }
                      />
                      {STAFF_PERMISSION_LABELS[key]}
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}

            <div className="wpb-user-management-form-actions">
              <button
                type="button"
                className="wpb-btn wpb-btn-ghost"
                disabled={saving}
                onClick={() => {
                  setMode('list');
                  setSelectedUserId(null);
                  setErrorMessage(null);
                }}
              >
                취소
              </button>
              <button type="submit" className="wpb-btn wpb-btn-primary" disabled={saving}>
                {saving ? '저장 중…' : mode === 'create' ? '생성' : '저장'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
