import { useCallback, useEffect, useState } from 'react';
import type { FightboxSessionUser, GymDto, GymStatus } from '@fightbox/shared';
import {
  createGym,
  deleteGym,
  GymAdminApiError,
  listGyms,
  updateGym,
} from './gymAdminApiClient';

const GYM_STATUSES: GymStatus[] = ['active', 'suspended', 'archived'];

const STATUS_LABELS: Record<GymStatus, string> = {
  active: '운영',
  suspended: '중지',
  archived: '보관',
};

interface GymFormState {
  gymCode: string;
  name: string;
  ownerName: string;
  phone: string;
  status: GymStatus;
}

const EMPTY_FORM: GymFormState = {
  gymCode: '',
  name: '',
  ownerName: '',
  phone: '',
  status: 'active',
};

interface GymManagementModalProps {
  isOpen: boolean;
  managerUser: FightboxSessionUser;
  onClose: () => void;
  onNotify: (message: string) => void;
}

export function GymManagementModal({
  isOpen,
  managerUser,
  onClose,
  onNotify,
}: GymManagementModalProps) {
  const [gyms, setGyms] = useState<GymDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [form, setForm] = useState<GymFormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadGyms = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await listGyms(managerUser);
      setGyms(data);
    } catch (error) {
      const message =
        error instanceof GymAdminApiError
          ? error.message
          : '체육관 목록을 불러오지 못했습니다.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }, [managerUser]);

  useEffect(() => {
    if (!isOpen) return;
    void loadGyms();
    setForm(EMPTY_FORM);
    setEditingId(null);
  }, [isOpen, loadGyms]);

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

  const handleEdit = (gym: GymDto) => {
    setEditingId(gym.id);
    setForm({
      gymCode: gym.gymCode,
      name: gym.name,
      ownerName: gym.ownerName,
      phone: gym.phone,
      status: gym.status,
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async () => {
    const gymCode = form.gymCode.trim();
    const name = form.name.trim();
    if (!gymCode || !name) {
      onNotify('체육관 코드와 이름을 입력해 주세요.');
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    try {
      if (editingId) {
        const updated = await updateGym(managerUser, editingId, {
          gymCode,
          name,
          ownerName: form.ownerName.trim(),
          phone: form.phone.trim(),
          status: form.status,
        });
        setGyms((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        onNotify(`「${updated.name}」 체육관 정보가 저장되었습니다.`);
        handleCancelEdit();
      } else {
        const created = await createGym(managerUser, {
          gymCode,
          name,
          ownerName: form.ownerName.trim(),
          phone: form.phone.trim(),
          status: form.status,
        });
        setGyms((prev) => [...prev, created].sort((a, b) => a.gymCode.localeCompare(b.gymCode)));
        onNotify(`「${created.name}」 체육관이 등록되었습니다.`);
        setForm(EMPTY_FORM);
      }
    } catch (error) {
      const message =
        error instanceof GymAdminApiError
          ? error.message
          : '체육관 저장에 실패했습니다.';
      setErrorMessage(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (gym: GymDto) => {
    if (gym.id === 'demo-gym') {
      onNotify('데모 체육관은 삭제할 수 없습니다.');
      return;
    }
    const confirmed = window.confirm(`「${gym.name}」 체육관을 삭제(보관)할까요?`);
    if (!confirmed) return;

    setDeletingId(gym.id);
    setErrorMessage(null);
    try {
      await deleteGym(managerUser, gym.id);
      setGyms((prev) => prev.filter((item) => item.id !== gym.id));
      if (editingId === gym.id) {
        handleCancelEdit();
      }
      onNotify(`「${gym.name}」 체육관이 삭제되었습니다.`);
    } catch (error) {
      const message =
        error instanceof GymAdminApiError
          ? error.message
          : '체육관 삭제에 실패했습니다.';
      setErrorMessage(message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="wpb-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="wpb-template-library-modal wpb-gym-management-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wpb-gym-management-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="wpb-template-library-header">
          <h2 id="wpb-gym-management-title">체육관 코드 관리</h2>
          <button type="button" className="wpb-btn wpb-btn-ghost" onClick={onClose}>
            닫기
          </button>
        </header>

        <p className="wpb-staff-permission-hint">
          슈퍼관리자 전용 · 체육관 테넌트 코드(gymCode)를 등록·수정합니다.
        </p>

        {errorMessage ? <p className="wpb-staff-permission-error">{errorMessage}</p> : null}

        <section className="wpb-gym-form">
          <h3>{editingId ? '체육관 수정' : '체육관 등록'}</h3>
          <div className="wpb-gym-form-grid">
            <label>
              체육관 코드
              <input
                type="text"
                value={form.gymCode}
                onChange={(e) => setForm((prev) => ({ ...prev, gymCode: e.target.value }))}
                placeholder="GYM-0001"
                disabled={Boolean(editingId)}
              />
            </label>
            <label>
              체육관명
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="OOO 피트니스"
              />
            </label>
            <label>
              대표자
              <input
                type="text"
                value={form.ownerName}
                onChange={(e) => setForm((prev) => ({ ...prev, ownerName: e.target.value }))}
              />
            </label>
            <label>
              연락처
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              />
            </label>
            <label>
              상태
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, status: e.target.value as GymStatus }))
                }
              >
                {GYM_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="wpb-gym-form-actions">
            <button
              type="button"
              className="wpb-btn wpb-btn-primary"
              disabled={saving}
              onClick={() => void handleSubmit()}
            >
              {saving ? '저장 중…' : editingId ? '수정 저장' : '등록'}
            </button>
            {editingId ? (
              <button type="button" className="wpb-btn wpb-btn-ghost" onClick={handleCancelEdit}>
                취소
              </button>
            ) : null}
          </div>
        </section>

        {loading ? (
          <p className="wpb-template-library-empty">불러오는 중…</p>
        ) : gyms.length === 0 ? (
          <p className="wpb-template-library-empty">등록된 체육관이 없습니다.</p>
        ) : (
          <ul className="wpb-gym-list">
            {gyms.map((gym) => (
              <li key={gym.id} className="wpb-gym-list-row">
                <div className="wpb-gym-list-main">
                  <strong>{gym.gymCode}</strong>
                  <span>{gym.name}</span>
                  <span className="wpb-gym-list-meta">
                    {gym.ownerName || '—'} · {gym.phone || '—'} · {STATUS_LABELS[gym.status]}
                  </span>
                </div>
                <div className="wpb-gym-list-actions">
                  <button type="button" className="wpb-btn wpb-btn-ghost" onClick={() => handleEdit(gym)}>
                    수정
                  </button>
                  <button
                    type="button"
                    className="wpb-btn wpb-btn-ghost"
                    disabled={deletingId === gym.id || gym.id === 'demo-gym'}
                    onClick={() => void handleDelete(gym)}
                  >
                    {deletingId === gym.id ? '삭제 중…' : '삭제'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
