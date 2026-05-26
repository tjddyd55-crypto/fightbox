/**
 * Browser speech synthesis helper.
 * Autoplay policies may block speak() until user gesture — failures are ignored.
 */
export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

let lastUtteranceKey = '';

export function speakMessage(message: string, options?: { lang?: string }): void {
  if (!isSpeechSynthesisSupported()) {
    return;
  }

  const text = message.trim();
  if (!text) {
    return;
  }

  const key = `${text}:${options?.lang ?? 'ko-KR'}`;
  if (key === lastUtteranceKey) {
    return;
  }
  lastUtteranceKey = key;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = options?.lang ?? 'ko-KR';
    utterance.rate = 1;
    window.speechSynthesis.speak(utterance);
  } catch {
    /* policy or browser limitation */
  }
}

export function cancelSpeech(): void {
  if (!isSpeechSynthesisSupported()) {
    return;
  }
  try {
    window.speechSynthesis.cancel();
    lastUtteranceKey = '';
  } catch {
    /* ignore */
  }
}
