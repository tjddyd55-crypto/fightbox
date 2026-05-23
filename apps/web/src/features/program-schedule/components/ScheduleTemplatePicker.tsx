import type { ProgramTemplateDto } from '@fightbox/shared';

interface ScheduleTemplatePickerProps {
  templates: ProgramTemplateDto[];
  loading: boolean;
  value: string;
  onChange: (templateId: string) => void;
}

export function ScheduleTemplatePicker({
  templates,
  loading,
  value,
  onChange,
}: ScheduleTemplatePickerProps) {
  if (loading) {
    return <p className="schedule-muted">템플릿 불러오는 중…</p>;
  }

  if (templates.length === 0) {
    return (
      <p className="schedule-muted">
        저장된 템플릿이 없습니다. 먼저 프로그램 빌더에서 템플릿을 저장해 주세요.
      </p>
    );
  }

  return (
    <label className="schedule-field">
      운동 템플릿
      <select value={value} onChange={(event) => onChange(event.target.value)} required>
        <option value="">템플릿 선택</option>
        {templates.map((template) => (
          <option key={template.id} value={template.id}>
            {template.title}
          </option>
        ))}
      </select>
    </label>
  );
}
