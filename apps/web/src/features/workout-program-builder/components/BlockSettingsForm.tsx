import type { ReactNode } from 'react';
import type { ProgramBlock, WorkoutVideo, VideoPlayMode } from '../types/workoutProgramBuilder.types';
import {
  MAX_DURATION_SEC,
  MAX_REPEAT_COUNT,
  MIN_DURATION_SEC,
  MIN_REPEAT_COUNT,
  clampInt,
  parsePositiveInt,
} from '../utils/blockSettingsUtils';
import { getVideoById } from '../utils/programTimelineUtils';
import type { ProgramBuilderState } from '../hooks/useProgramBuilderState';

interface BlockSettingsFormProps {
  block: ProgramBlock | null;
  videos: WorkoutVideo[];
  onUpdateBlock: ProgramBuilderState['updateBlock'];
  onUpdateVideoSettings: ProgramBuilderState['updateVideoBlockSettings'];
}

function SettingsSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="wpb-settings-section wpb-settings-section--compact">
      <h4 className="wpb-settings-section-title">{title}</h4>
      {children}
    </section>
  );
}

const VOICE_CUE_ITEMS = [
  { key: 'ready' as const, label: 'Ready' },
  { key: 'go' as const, label: 'Go' },
  { key: 'stop' as const, label: 'Stop' },
  { key: 'lastTenCount' as const, label: '마지막 10초 카운트' },
];

export function BlockSettingsForm({
  block,
  videos,
  onUpdateBlock,
  onUpdateVideoSettings,
}: BlockSettingsFormProps) {
  if (!block) {
    return <p className="wpb-empty wpb-empty--compact">설정할 블록을 선택하세요.</p>;
  }

  if (block.type === 'video') {
    const video = getVideoById(videos, block.videoId);
    const playMode = block.playMode;

    const setPlayMode = (mode: VideoPlayMode) => {
      onUpdateVideoSettings(block.id, { playMode: mode });
    };

    return (
      <form className="wpb-form wpb-form--settings" onSubmit={(e) => e.preventDefault()}>
        <SettingsSection title="재생 방식">
          <fieldset className="wpb-field wpb-field--plain">
            <legend className="sr-only">재생 방식</legend>
            <div className="wpb-play-mode-list">
              <label
                className={`wpb-play-mode-row${playMode === 'original_duration' ? ' is-selected' : ''}`}
              >
                <input
                  type="radio"
                  name={`playMode-${block.id}`}
                  className="wpb-play-mode-radio"
                  checked={playMode === 'original_duration'}
                  onChange={() => setPlayMode('original_duration')}
                />
                <span className="wpb-play-mode-label">원본 길이 재생</span>
              </label>

              <div
                className={`wpb-play-mode-row wpb-play-mode-row--with-input${playMode === 'repeat_count' ? ' is-selected' : ''}`}
              >
                <label className="wpb-play-mode-row-label" htmlFor={`repeat-radio-${block.id}`}>
                  <input
                    id={`repeat-radio-${block.id}`}
                    type="radio"
                    name={`playMode-${block.id}`}
                    className="wpb-play-mode-radio"
                    checked={playMode === 'repeat_count'}
                    onChange={() => setPlayMode('repeat_count')}
                  />
                  <span className="wpb-play-mode-label">반복 횟수</span>
                </label>
                <span className="wpb-input-unit-group">
                  <input
                    id={`repeat-count-${block.id}`}
                    type="number"
                    min={1}
                    className="wpb-inline-input"
                    value={block.repeatCount ?? 1}
                    disabled={playMode !== 'repeat_count'}
                    onChange={(e) =>
                      onUpdateVideoSettings(block.id, {
                        repeatCount: parsePositiveInt(
                          e.target.value,
                          block.repeatCount ?? 1,
                          MIN_REPEAT_COUNT,
                          MAX_REPEAT_COUNT,
                        ),
                        playMode: 'repeat_count',
                      })
                    }
                    aria-label="반복 횟수"
                  />
                  <span className="wpb-unit-suffix">회</span>
                </span>
              </div>

              <div
                className={`wpb-play-mode-row wpb-play-mode-row--with-input${playMode === 'loop_until_duration' ? ' is-selected' : ''}`}
              >
                <label className="wpb-play-mode-row-label" htmlFor={`loop-radio-${block.id}`}>
                  <input
                    id={`loop-radio-${block.id}`}
                    type="radio"
                    name={`playMode-${block.id}`}
                    className="wpb-play-mode-radio"
                    checked={playMode === 'loop_until_duration'}
                    onChange={() => setPlayMode('loop_until_duration')}
                  />
                  <span className="wpb-play-mode-label">지정 시간까지 반복</span>
                </label>
                <span className="wpb-input-unit-group">
                  <input
                    id={`target-duration-${block.id}`}
                    type="number"
                    min={video?.durationSec ?? 1}
                    className="wpb-inline-input"
                    value={block.targetDurationSec ?? video?.durationSec ?? 60}
                    disabled={playMode !== 'loop_until_duration'}
                    onChange={(e) =>
                      onUpdateVideoSettings(block.id, {
                        targetDurationSec: parsePositiveInt(
                          e.target.value,
                          block.targetDurationSec ?? video?.durationSec ?? 60,
                          video?.durationSec ?? MIN_DURATION_SEC,
                          MAX_DURATION_SEC,
                        ),
                        playMode: 'loop_until_duration',
                      })
                    }
                    aria-label="지정 시간 초"
                  />
                  <span className="wpb-unit-suffix">초</span>
                </span>
              </div>
            </div>
          </fieldset>
        </SettingsSection>

        <SettingsSection title="블록 이후 휴식">
          <div className="wpb-field-row">
            <label className="sr-only" htmlFor={`rest-after-${block.id}`}>
              블록 이후 휴식
            </label>
            <span className="wpb-input-unit-group wpb-input-unit-group--end">
              <input
                id={`rest-after-${block.id}`}
                type="number"
                min={0}
                className="wpb-inline-input wpb-inline-input--rest"
                value={block.restAfterSec ?? 0}
                onChange={(e) =>
                  onUpdateVideoSettings(block.id, {
                    restAfterSec: clampInt(
                      Number(e.target.value),
                      0,
                      MAX_DURATION_SEC,
                    ),
                  })
                }
              />
              <span className="wpb-unit-suffix">초</span>
            </span>
          </div>
        </SettingsSection>

        <SettingsSection title="음성 가이드">
          <fieldset className="wpb-field wpb-field--plain">
            <legend className="sr-only">음성 가이드</legend>
            <ul className="wpb-voice-grid">
              {VOICE_CUE_ITEMS.map(({ key, label }) => {
                const inputId = `voice-${key}-${block.id}`;
                return (
                  <li key={key} className="wpb-voice-item">
                    <input
                      id={inputId}
                      type="checkbox"
                      className="wpb-voice-checkbox"
                      checked={block.voiceCues[key]}
                      onChange={(e) =>
                        onUpdateVideoSettings(block.id, {
                          voiceCues: { ...block.voiceCues, [key]: e.target.checked },
                        })
                      }
                    />
                    <label className="wpb-voice-label" htmlFor={inputId}>
                      {label}
                    </label>
                    <button
                      type="button"
                      className="wpb-btn wpb-btn-voice-preview"
                      aria-label={`${label} 미리듣기`}
                    >
                      미리듣기
                    </button>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        </SettingsSection>
      </form>
    );
  }

  if (block.type === 'rest') {
    return (
      <form className="wpb-form wpb-form--settings" onSubmit={(e) => e.preventDefault()}>
        <SettingsSection title="휴식 설정">
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
                    b.type === 'rest'
                      ? {
                          ...b,
                          durationSec: sec,
                          title: `휴식 ${sec}초`,
                        }
                      : b,
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
        </SettingsSection>
      </form>
    );
  }

  if (block.type === 'countdown') {
    return (
      <form className="wpb-form wpb-form--settings" onSubmit={(e) => e.preventDefault()}>
        <SettingsSection title="카운트다운">
          <label className="wpb-field wpb-field--compact" htmlFor={`countdown-${block.id}`}>
            <span className="wpb-field-label">시간</span>
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
                      ? {
                          ...b,
                          countFromSec: sec,
                          durationSec: sec,
                          title: `카운트다운 ${sec}초`,
                        }
                      : b,
                  );
                }}
              />
              <span className="wpb-unit-suffix">초</span>
            </span>
          </label>
        </SettingsSection>
      </form>
    );
  }

  return (
    <form className="wpb-form wpb-form--settings" onSubmit={(e) => e.preventDefault()}>
      <SettingsSection title="음성 안내">
        <label className="wpb-field wpb-field--compact" htmlFor={`voice-cue-${block.id}`}>
          <span className="wpb-field-label">안내 문구</span>
          <input
            id={`voice-cue-${block.id}`}
            type="text"
            value={block.cueText}
            onChange={(e) =>
              onUpdateBlock(block.id, (b) =>
                b.type === 'voice'
                  ? { ...b, cueText: e.target.value, title: e.target.value || '음성 안내' }
                  : b,
              )
            }
          />
        </label>
        <label className="wpb-field wpb-field--compact" htmlFor={`voice-duration-${block.id}`}>
          <span className="wpb-field-label">재생 길이</span>
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
      </SettingsSection>
    </form>
  );
}
