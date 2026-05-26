import type { VoiceProgramBlock } from '../../types/workoutProgramBuilder.types';
import {
  MAX_DURATION_SEC,
  MIN_DURATION_SEC,
  parsePositiveInt,
} from '../../utils/blockSettingsUtils';
import { speakMessage, isSpeechSynthesisSupported } from '../../utils/speechSynthesisUtils';
import type { ProgramBuilderState } from '../../hooks/useProgramBuilderState';

interface VoiceGuideBlockSettingsProps {
  block: VoiceProgramBlock;
  onUpdateBlock: ProgramBuilderState['updateBlock'];
}

export function VoiceGuideBlockSettings({ block, onUpdateBlock }: VoiceGuideBlockSettingsProps) {
  const message = block.message ?? block.cueText;

  return (
    <form className="wpb-form wpb-form--settings" onSubmit={(e) => e.preventDefault()}>
      <section className="wpb-settings-section wpb-settings-section--compact">
        <h4 className="wpb-settings-section-title">음성 안내</h4>
        <label className="wpb-field wpb-field--compact" htmlFor={`voice-title-${block.id}`}>
          <span className="wpb-field-label">제목</span>
          <input
            id={`voice-title-${block.id}`}
            type="text"
            value={block.title}
            onChange={(e) =>
              onUpdateBlock(block.id, (b) =>
                b.type === 'voice' ? { ...b, title: e.target.value } : b,
              )
            }
          />
        </label>
        <label className="wpb-field wpb-field--compact" htmlFor={`voice-cue-${block.id}`}>
          <span className="wpb-field-label">안내 문구</span>
          <input
            id={`voice-cue-${block.id}`}
            type="text"
            value={message}
            onChange={(e) => {
              const text = e.target.value;
              onUpdateBlock(block.id, (b) =>
                b.type === 'voice'
                  ? { ...b, cueText: text, message: text }
                  : b,
              );
            }}
          />
        </label>
        <label className="wpb-field wpb-field--compact" htmlFor={`voice-duration-${block.id}`}>
          <span className="wpb-field-label">안내 표시 시간</span>
          <span className="wpb-input-unit-group">
            <input
              id={`voice-duration-${block.id}`}
              type="number"
              min={MIN_DURATION_SEC}
              max={MAX_DURATION_SEC}
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
                  b.type === 'voice' ? { ...b, durationSec: sec } : b,
                );
              }}
            />
            <span className="wpb-unit-suffix">초</span>
          </span>
        </label>
        {isSpeechSynthesisSupported() ? (
          <button
            type="button"
            className="wpb-btn wpb-btn-ghost wpb-btn--compact"
            onClick={() => speakMessage(message)}
          >
            미리 듣기
          </button>
        ) : (
          <p className="wpb-sync-hint">이 브라우저에서는 음성 미리듣기를 지원하지 않습니다.</p>
        )}
      </section>
    </form>
  );
}
