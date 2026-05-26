import type { RestProgramBlock } from '../../types/workoutProgramBuilder.types';
import {
  MAX_DURATION_SEC,
  MIN_DURATION_SEC,
  parsePositiveInt,
} from '../../utils/blockSettingsUtils';
import type { ProgramBuilderState } from '../../hooks/useProgramBuilderState';

interface RestBlockSettingsProps {
  block: RestProgramBlock;
  onUpdateBlock: ProgramBuilderState['updateBlock'];
}

export function RestBlockSettings({ block, onUpdateBlock }: RestBlockSettingsProps) {
  return (
    <form className="wpb-form wpb-form--settings" onSubmit={(e) => e.preventDefault()}>
      <section className="wpb-settings-section wpb-settings-section--compact">
        <h4 className="wpb-settings-section-title">휴식 설정</h4>
        <label className="wpb-field wpb-field--compact" htmlFor={`rest-title-${block.id}`}>
          <span className="wpb-field-label">제목</span>
          <input
            id={`rest-title-${block.id}`}
            type="text"
            value={block.title}
            onChange={(e) =>
              onUpdateBlock(block.id, (b) =>
                b.type === 'rest' ? { ...b, title: e.target.value } : b,
              )
            }
          />
        </label>
        <label className="wpb-field wpb-field--compact" htmlFor={`rest-duration-${block.id}`}>
          <span className="wpb-field-label">휴식 시간</span>
          <span className="wpb-input-unit-group">
            <input
              id={`rest-duration-${block.id}`}
              type="number"
              min={1}
              className="wpb-inline-input wpb-inline-input--rest"
              value={block.durationSec}
              onChange={(e) => {
                const sec = parsePositiveInt(
                  e.target.value,
                  block.durationSec,
                  MIN_DURATION_SEC,
                  MAX_DURATION_SEC,
                );
                onUpdateBlock(block.id, (b) =>
                  b.type === 'rest' ? { ...b, durationSec: sec } : b,
                );
              }}
            />
            <span className="wpb-unit-suffix">초</span>
          </span>
        </label>
        <label className="wpb-field wpb-field--compact" htmlFor={`rest-message-${block.id}`}>
          <span className="wpb-field-label">안내 문구</span>
          <input
            id={`rest-message-${block.id}`}
            type="text"
            value={block.message ?? ''}
            onChange={(e) =>
              onUpdateBlock(block.id, (b) =>
                b.type === 'rest' ? { ...b, message: e.target.value } : b,
              )
            }
          />
        </label>
      </section>
    </form>
  );
}
