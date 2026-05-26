import { useEffect } from 'react';
import { formatPlayerTime } from '../utils/programPlayerTimeUtils';
import type { ProgramPlayerBlock } from '../types/programPlayer.types';
import {
  cancelSpeech,
  speakMessage,
} from '../../workout-program-builder/utils/speechSynthesisUtils';

interface ProgramVoiceGuideBlockScreenProps {
  block: ProgramPlayerBlock;
  remainingSec: number;
  isPlaying: boolean;
  variant?: 'default' | 'display';
}

/**
 * Voice guide uses browser speechSynthesis when available.
 * Autoplay policies may block speak() until a user gesture — text is always shown.
 */
export function ProgramVoiceGuideBlockScreen({
  block,
  remainingSec,
  isPlaying,
  variant = 'default',
}: ProgramVoiceGuideBlockScreenProps) {
  const message = block.message ?? block.description ?? block.title;

  useEffect(() => {
    if (!isPlaying) {
      cancelSpeech();
      return;
    }
    speakMessage(message);
    return () => cancelSpeech();
  }, [block.id, isPlaying, message]);

  return (
    <section className={`pp-voice-screen pp-voice-screen--${variant}`}>
      <div className="pp-voice-card">
        <span className="pp-voice-icon" aria-hidden>
          🎤
        </span>
        <p className="pp-voice-label">음성 안내</p>
        <p className="pp-voice-message">{message}</p>
        <p className="pp-voice-timer">{formatPlayerTime(remainingSec)}</p>
      </div>
    </section>
  );
}
