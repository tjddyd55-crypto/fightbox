import type { ReactNode } from 'react';
import type { ProgramBlock, WorkoutVideo, VideoPlayMode } from '../types/workoutProgramBuilder.types';
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
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="wpb-settings-section">
      <header className="wpb-settings-section-header">
        <h4>{title}</h4>
        {description && <p>{description}</p>}
      </header>
      {children}
    </section>
  );
}

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

    const setPlayMode = (playMode: VideoPlayMode) => {
      onUpdateVideoSettings(block.id, { playMode });
    };

    return (
      <form className="wpb-form" onSubmit={(e) => e.preventDefault()}>
        <SettingsSection title="재생 방식" description="블록 재생 길이를 결정합니다.">
          <fieldset className="wpb-field wpb-field--plain">
            <legend className="sr-only">재생 방식</legend>
            <div className="wpb-radio-group">
              <label className="wpb-radio">
                <input
                  type="radio"
                  name="playMode"
                  checked={block.playMode === 'original_duration'}
                  onChange={() => setPlayMode('original_duration')}
                />
                원본 길이 재생
              </label>
              <label className="wpb-radio">
                <input
                  type="radio"
                  name="playMode"
                  checked={block.playMode === 'repeat_count'}
                  onChange={() => setPlayMode('repeat_count')}
                />
                반복 횟수
              </label>
              <label className="wpb-radio">
                <input
                  type="radio"
                  name="playMode"
                  checked={block.playMode === 'loop_until_duration'}
                  onChange={() => setPlayMode('loop_until_duration')}
                />
                지정 시간까지 반복
              </label>
            </div>
          </fieldset>
        </SettingsSection>

        {block.playMode === 'repeat_count' && (
          <SettingsSection title="반복 횟수">
            <label className="wpb-field">
              <span className="wpb-field-label">횟수</span>
              <input
                type="number"
                min={1}
                value={block.repeatCount ?? 1}
                onChange={(e) =>
                  onUpdateVideoSettings(block.id, {
                    repeatCount: Number(e.target.value),
                  })
                }
              />
            </label>
          </SettingsSection>
        )}

        {block.playMode === 'loop_until_duration' && (
          <SettingsSection title="지정 시간 반복">
            <label className="wpb-field">
              <span className="wpb-field-label">목표 시간 (초)</span>
              <input
                type="number"
                min={video?.durationSec ?? 1}
                value={block.targetDurationSec ?? video?.durationSec ?? 60}
                onChange={(e) =>
                  onUpdateVideoSettings(block.id, {
                    targetDurationSec: Number(e.target.value),
                  })
                }
              />
            </label>
          </SettingsSection>
        )}

        <SettingsSection title="블록 이후 휴식">
          <label className="wpb-field">
            <span className="wpb-field-label">휴식 (초)</span>
            <input
              type="number"
              min={0}
              value={block.restAfterSec ?? 0}
              onChange={(e) =>
                onUpdateVideoSettings(block.id, {
                  restAfterSec: Number(e.target.value),
                })
              }
            />
          </label>
        </SettingsSection>

        <SettingsSection title="음성 가이드">
          <fieldset className="wpb-field wpb-field--plain">
            <legend className="sr-only">음성 안내</legend>
            <div className="wpb-checkbox-grid">
              {(
                [
                  ['ready', 'Ready'],
                  ['go', 'Go'],
                  ['stop', 'Stop'],
                  ['lastTenCount', '마지막 10초'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="wpb-checkbox">
                  <input
                    type="checkbox"
                    checked={block.voiceCues[key]}
                    onChange={(e) =>
                      onUpdateVideoSettings(block.id, {
                        voiceCues: { ...block.voiceCues, [key]: e.target.checked },
                      })
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        </SettingsSection>
      </form>
    );
  }

  if (block.type === 'rest') {
    return (
      <form className="wpb-form" onSubmit={(e) => e.preventDefault()}>
        <SettingsSection title="휴식 설정">
          <label className="wpb-field">
            <span className="wpb-field-label">휴식 시간 (초)</span>
            <input
              type="number"
              min={1}
              value={block.durationSec}
              onChange={(e) =>
                onUpdateBlock(block.id, (b) =>
                  b.type === 'rest'
                    ? {
                        ...b,
                        durationSec: Number(e.target.value),
                        title: `휴식 ${e.target.value}초`,
                      }
                    : b,
                )
              }
            />
          </label>
          <label className="wpb-field">
            <span className="wpb-field-label">안내 문구</span>
            <input
              type="text"
              value={block.message ?? ''}
              onChange={(e) =>
                onUpdateBlock(block.id, (b) =>
                  b.type === 'rest' ? { ...b, message: e.target.value } : b,
                )
              }
            />
          </label>
          <label className="wpb-field">
            <span className="wpb-field-label">다음 운동명</span>
            <input
              type="text"
              value={block.nextBlockTitle ?? ''}
              onChange={(e) =>
                onUpdateBlock(block.id, (b) =>
                  b.type === 'rest' ? { ...b, nextBlockTitle: e.target.value } : b,
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
      <form className="wpb-form" onSubmit={(e) => e.preventDefault()}>
        <SettingsSection title="카운트다운">
          <label className="wpb-field">
            <span className="wpb-field-label">시간 (초)</span>
            <input
              type="number"
              min={1}
              value={block.countFromSec}
              onChange={(e) => {
                const sec = Number(e.target.value);
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
          </label>
        </SettingsSection>
      </form>
    );
  }

  return (
    <form className="wpb-form" onSubmit={(e) => e.preventDefault()}>
      <SettingsSection title="음성 안내">
        <label className="wpb-field">
          <span className="wpb-field-label">안내 문구</span>
          <input
            type="text"
            value={block.cueText}
            onChange={(e) =>
              onUpdateBlock(block.id, (b) =>
                b.type === 'voice'
                  ? { ...b, cueText: e.target.value, title: e.target.value }
                  : b,
              )
            }
          />
        </label>
      </SettingsSection>
    </form>
  );
}
