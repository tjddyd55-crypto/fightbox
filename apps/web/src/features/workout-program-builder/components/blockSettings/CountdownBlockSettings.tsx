import type { CountdownProgramBlock } from '../../types/workoutProgramBuilder.types';
import {
  MAX_DURATION_SEC,
  MIN_DURATION_SEC,
  parsePositiveInt,
} from '../../utils/blockSettingsUtils';
import { speakMessage, isSpeechSynthesisSupported } from '../../utils/speechSynthesisUtils';
import type { ProgramBuilderState } from '../../hooks/useProgramBuilderState';

interface CountdownBlockSettingsProps {
  block: CountdownProgramBlock;
  onUpdateBlock: ProgramBuilderState['updateBlock'];
}

export function CountdownBlockSettings({ block, onUpdateBlock }: CountdownBlockSettingsProps) {
  return (
    <form className="wpb-form wpb-form--settings" onSubmit={(e) => e.preventDefault()}>
      <section className="wpb-settings-section wpb-settings-section--compact">
        <h4 className="wpb-settings-section-title">카운트다운</h4>
        <label className="wpb-field wpb-field--compact" htmlFor={`countdown-title-${block.id}`}>
          <span className="wpb-field-label">제목</span>
          <input
            id={`countdown-title-${block.id}`}
            type="text"
            value={block.title}
            onChange={(e) =>
              onUpdateBlock(block.id, (b) =>
                b.type === 'countdown' ? { ...b, title: e.target.value } : b,
              )
            }
          />
        </label>
        <label className="wpb-field wpb-field--compact" htmlFor={`countdown-message-${block.id}`}>
          <span className="wpb-field-label">안내 문구</span>
          <input
            id={`countdown-message-${block.id}`}
            type="text"
            value={block.message ?? ''}
            onChange={(e) =>
              onUpdateBlock(block.id, (b) =>
                b.type === 'countdown' ? { ...b, message: e.target.value } : b,
              )
            }
          />
        </label>
        <label className="wpb-field wpb-field--compact" htmlFor={`countdown-${block.id}`}>
          <span className="wpb-field-label">카운트다운 시간</span>
          <span className="wpb-input-unit-group">
            <input
              id={`countdown-${block.id}`}
              type="number"
              min={1}
              className="wpb-inline-input wpb-inline-input--rest"
              value={block.countFromSec}
              onChange={(e) => {
                const sec = parsePositiveInt(
                  e.target.value,
                  block.countFromSec,
                  MIN_DURATION_SEC,
                  MAX_DURATION_SEC,
                );
                onUpdateBlock(block.id, (b) =>
                  b.type === 'countdown'
                    ? { ...b, countFromSec: sec, durationSec: sec }
                    : b,
                );
              }}
            />
            <span className="wpb-unit-suffix">초</span>
          </span>
        </label>
        {isSpeechSynthesisSupported() && (
          <button
            type="button"
            className="wpb-btn wpb-btn-ghost wpb-btn--compact"
            onClick={() => speakMessage(block.message ?? '준비하세요')}
          >
            미리 듣기
          </button>
        )}
      </section>
    </form>
  );
}
