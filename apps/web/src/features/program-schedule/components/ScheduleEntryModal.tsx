import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { ProgramScheduleEntryDto, ProgramTemplateDto } from '@fightbox/shared';
import { useNavigate } from 'react-router-dom';
import {
  DAY_LABELS,
  defaultColorForTemplate,
  defaultDurationFromTemplate,
  DURATION_OPTIONS,
  generateTimeSlots,
} from '../programSchedule.utils';
import { ScheduleTemplatePicker } from './ScheduleTemplatePicker';

interface ScheduleEntryModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  entry: ProgramScheduleEntryDto | null;
  initialDayOfWeek: number;
  initialStartTime: string;
  templates: ProgramTemplateDto[];
  templatesLoading: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmitCreate: (input: {
    templateId: string;
    title?: string;
    dayOfWeek: number;
    startTime: string;
    durationMin: number;
    coachName?: string;
    roomName?: string;
    color?: string;
  }) => Promise<void>;
  onSubmitUpdate: (
    id: string,
    input: {
      templateId?: string;
      title?: string;
      dayOfWeek?: number;
      startTime?: string;
      durationMin?: number;
      coachName?: string;
      roomName?: string;
      color?: string;
    },
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ScheduleEntryModal({
  isOpen,
  mode,
  entry,
  initialDayOfWeek,
  initialStartTime,
  templates,
  templatesLoading,
  submitting,
  onClose,
  onSubmitCreate,
  onSubmitUpdate,
  onDelete,
}: ScheduleEntryModalProps) {
  const navigate = useNavigate();
  const timeSlots = useMemo(() => generateTimeSlots(), []);

  const [templateId, setTemplateId] = useState('');
  const [title, setTitle] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState(initialDayOfWeek);
  const [startTime, setStartTime] = useState(initialStartTime);
  const [durationMin, setDurationMin] = useState<number>(60);
  const [coachName, setCoachName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [color, setColor] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setErrorMessage(null);

    if (mode === 'edit' && entry) {
      setTemplateId(entry.templateId);
      setTitle(entry.title);
      setDayOfWeek(entry.dayOfWeek);
      setStartTime(entry.startTime);
      setDurationMin(entry.durationMin);
      setCoachName(entry.coachName ?? '');
      setRoomName(entry.roomName ?? '');
      setColor(entry.color ?? '');
      return;
    }

    setTemplateId('');
    setTitle('');
    setDayOfWeek(initialDayOfWeek);
    setStartTime(initialStartTime);
    setDurationMin(60);
    setCoachName('');
    setRoomName('');
    setColor('');
  }, [isOpen, mode, entry, initialDayOfWeek, initialStartTime]);

  useEffect(() => {
    if (!templateId) {
      return;
    }
    const template = templates.find((item) => item.id === templateId);
    if (!template) {
      return;
    }
    if (mode === 'create') {
      setDurationMin(defaultDurationFromTemplate(template.totalDurationSec));
      if (!color) {
        setColor(defaultColorForTemplate(template.id));
      }
    }
  }, [templateId, templates, mode, color]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);

    if (!templateId) {
      setErrorMessage('템플릿을 선택해 주세요.');
      return;
    }

    const payload = {
      templateId,
      ...(title.trim() ? { title: title.trim() } : {}),
      dayOfWeek,
      startTime,
      durationMin,
      ...(coachName.trim() ? { coachName: coachName.trim() } : {}),
      ...(roomName.trim() ? { roomName: roomName.trim() } : {}),
      ...(color.trim() ? { color: color.trim() } : {}),
    };

    try {
      if (mode === 'edit' && entry) {
        await onSubmitUpdate(entry.id, payload);
      } else {
        await onSubmitCreate(payload);
      }
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '저장에 실패했습니다.');
    }
  };

  const handleDelete = async () => {
    if (!entry) return;
    const confirmed = window.confirm(`「${entry.title}」 수업을 시간표에서 삭제할까요?`);
    if (!confirmed) return;

    try {
      await onDelete(entry.id);
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '삭제에 실패했습니다.');
    }
  };

  const handlePlay = () => {
    if (!entry) return;
    navigate(`/programs/${encodeURIComponent(entry.templateId)}/play`);
  };

  return (
    <div className="schedule-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="schedule-modal"
        role="dialog"
        aria-labelledby="schedule-entry-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="schedule-entry-modal-title">
          {mode === 'create' ? '수업 배치' : '수업 수정'}
        </h2>

        <form className="schedule-form" onSubmit={handleSubmit}>
          <ScheduleTemplatePicker
            templates={templates}
            loading={templatesLoading}
            value={templateId}
            onChange={setTemplateId}
          />

          <label className="schedule-field">
            표시 제목 (선택)
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="비우면 템플릿 제목 사용"
            />
          </label>

          <label className="schedule-field">
            요일
            <select
              value={dayOfWeek}
              onChange={(event) => setDayOfWeek(Number.parseInt(event.target.value, 10))}
            >
              {DAY_LABELS.map((label, index) => (
                <option key={label} value={index}>
                  {label}요일
                </option>
              ))}
            </select>
          </label>

          <label className="schedule-field">
            시작 시간
            <select value={startTime} onChange={(event) => setStartTime(event.target.value)}>
              {timeSlots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </label>

          <label className="schedule-field">
            수업 시간
            <select
              value={durationMin}
              onChange={(event) => setDurationMin(Number.parseInt(event.target.value, 10))}
            >
              {DURATION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}분
                </option>
              ))}
            </select>
          </label>

          <label className="schedule-field">
            코치명 (선택)
            <input type="text" value={coachName} onChange={(event) => setCoachName(event.target.value)} />
          </label>

          <label className="schedule-field">
            룸/공간 (선택)
            <input type="text" value={roomName} onChange={(event) => setRoomName(event.target.value)} />
          </label>

          <label className="schedule-field">
            카드 색상 (선택)
            <input type="color" value={color || '#ffd60a'} onChange={(event) => setColor(event.target.value)} />
          </label>

          {errorMessage ? <p className="schedule-error">{errorMessage}</p> : null}

          <div className="schedule-modal-actions">
            {mode === 'edit' && entry ? (
              <>
                <button type="button" className="schedule-btn schedule-btn--danger" onClick={handleDelete}>
                  삭제
                </button>
                <button type="button" className="schedule-btn" onClick={handlePlay}>
                  프로그램 실행
                </button>
              </>
            ) : null}
            <button type="button" className="schedule-btn" onClick={onClose}>
              취소
            </button>
            <button type="submit" className="schedule-btn schedule-btn--primary" disabled={submitting}>
              {submitting ? '저장 중…' : '저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
