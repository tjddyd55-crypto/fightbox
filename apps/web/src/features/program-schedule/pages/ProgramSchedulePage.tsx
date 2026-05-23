import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { ProgramScheduleEntryDto, ProgramTemplateDto } from '@fightbox/shared';
import { useAuth } from '../../auth/AuthContext';
import { fetchProgramTemplates } from '../../workout-program-builder/services/workoutBuilderApiClient';
import { getFightboxClientPermissionsForUser } from '../../workout-program-builder/services/fightboxPermissions';
import {
  createProgramScheduleEntry,
  deleteProgramScheduleEntry,
  listProgramScheduleEntries,
  ProgramScheduleApiError,
  updateProgramScheduleEntry,
} from '../programScheduleApiClient';
import { ScheduleEntryModal } from '../components/ScheduleEntryModal';
import { ScheduleToolbar } from '../components/ScheduleToolbar';
import { WeeklyScheduleGrid } from '../components/WeeklyScheduleGrid';
import '../programSchedule.css';

export function ProgramSchedulePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<ProgramScheduleEntryDto[]>([]);
  const [templates, setTemplates] = useState<ProgramTemplateDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedEntry, setSelectedEntry] = useState<ProgramScheduleEntryDto | null>(null);
  const [initialDayOfWeek, setInitialDayOfWeek] = useState(1);
  const [initialStartTime, setInitialStartTime] = useState('09:00');

  const permissions = useMemo(
    () => (user ? getFightboxClientPermissionsForUser(user) : null),
    [user],
  );

  const showMessage = useCallback((message: string) => {
    setStatusMessage(message);
    window.setTimeout(() => setStatusMessage(null), 4000);
  }, []);

  const loadData = useCallback(async () => {
    if (!user || !permissions?.canViewProgramSchedule) {
      return;
    }

    setLoading(true);
    try {
      const nextEntries = await listProgramScheduleEntries(user);
      setEntries(nextEntries);
    } catch (error) {
      showMessage(
        error instanceof ProgramScheduleApiError ? error.message : '스케줄을 불러오지 못했습니다.',
      );
    } finally {
      setLoading(false);
    }
  }, [user, permissions, showMessage]);

  const loadTemplates = useCallback(async () => {
    setTemplatesLoading(true);
    try {
      const nextTemplates = await fetchProgramTemplates();
      setTemplates(nextTemplates);
    } catch {
      setTemplates([]);
    } finally {
      setTemplatesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
    void loadTemplates();
  }, [loadData, loadTemplates]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const openCreateModal = (dayOfWeek: number, startTime: string) => {
    setModalMode('create');
    setSelectedEntry(null);
    setInitialDayOfWeek(dayOfWeek);
    setInitialStartTime(startTime);
    setModalOpen(true);
  };

  const openEditModal = (entry: ProgramScheduleEntryDto) => {
    setModalMode('edit');
    setSelectedEntry(entry);
    setInitialDayOfWeek(entry.dayOfWeek);
    setInitialStartTime(entry.startTime);
    setModalOpen(true);
  };

  const handleCreate = async (input: Parameters<typeof createProgramScheduleEntry>[1]) => {
    if (!user) return;
    setSubmitting(true);
    try {
      await createProgramScheduleEntry(user, input);
      showMessage('수업이 시간표에 배치되었습니다.');
      await loadData();
    } catch (error) {
      throw error instanceof ProgramScheduleApiError
        ? error
        : new Error('수업 배치에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (
    id: string,
    input: Parameters<typeof updateProgramScheduleEntry>[2],
  ) => {
    if (!user) return;
    setSubmitting(true);
    try {
      await updateProgramScheduleEntry(user, id, input);
      showMessage('수업 정보가 수정되었습니다.');
      await loadData();
    } catch (error) {
      throw error instanceof ProgramScheduleApiError
        ? error
        : new Error('수업 수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    setSubmitting(true);
    try {
      await deleteProgramScheduleEntry(user, id);
      showMessage('수업이 시간표에서 삭제되었습니다.');
      await loadData();
    } catch (error) {
      throw error instanceof ProgramScheduleApiError
        ? error
        : new Error('수업 삭제에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || !permissions) {
    return null;
  }

  if (!permissions.canViewProgramSchedule) {
    return (
      <div className="schedule-page schedule-page--denied">
        <div className="schedule-denied-card">
          <h1>주간 프로그램 스케줄</h1>
          <p>스케줄 조회 권한이 없습니다.</p>
          <Link to="/dashboard" className="schedule-btn schedule-btn--primary">
            대시보드로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="schedule-page">
      <div className="schedule-page-top">
        <Link to="/dashboard" className="schedule-back-link">
          ← 대시보드
        </Link>
        <button type="button" className="schedule-btn" onClick={handleLogout}>
          로그아웃
        </button>
      </div>

      <ScheduleToolbar
        title="주간 프로그램 스케줄"
        entryCount={entries.length}
        canManage={permissions.canManageProgramSchedule}
        onRefresh={() => {
          void loadData();
          void loadTemplates();
        }}
        loading={loading}
      />

      <WeeklyScheduleGrid
        entries={entries}
        canManage={permissions.canManageProgramSchedule}
        onSlotClick={openCreateModal}
        onEntryClick={openEditModal}
      />

      <ScheduleEntryModal
        isOpen={modalOpen}
        mode={modalMode}
        entry={selectedEntry}
        initialDayOfWeek={initialDayOfWeek}
        initialStartTime={initialStartTime}
        templates={templates}
        templatesLoading={templatesLoading}
        submitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmitCreate={handleCreate}
        onSubmitUpdate={handleUpdate}
        onDelete={handleDelete}
      />

      {statusMessage ? (
        <p className="schedule-status-toast" role="status">
          {statusMessage}
        </p>
      ) : null}
    </div>
  );
}
