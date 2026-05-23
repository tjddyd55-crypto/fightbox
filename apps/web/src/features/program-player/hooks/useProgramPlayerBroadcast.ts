import { useCallback, useEffect, useRef } from 'react';
import type {
  ProgramPlayerBroadcastMessage,
  ProgramPlayerOutgoingMessage,
  ProgramPlayerSnapshot,
  ProgramPlayerSource,
} from '../types/programPlayer.types';

/** @deprecated demo-only fallback; prefer buildProgramPlayerBroadcastChannel */
export const PROGRAM_PLAYER_BROADCAST_CHANNEL = 'fightbox-program-player-demo';

const instanceId =
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `player-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function buildProgramPlayerBroadcastChannel(
  programId: string,
  source: ProgramPlayerSource,
): string {
  return `fightbox-program-player:${programId}:${source}`;
}

export function useProgramPlayerBroadcast(
  channelName: string,
  onMessage: (message: ProgramPlayerBroadcastMessage) => void,
): {
  broadcast: (message: ProgramPlayerOutgoingMessage) => void;
  isSupported: boolean;
} {
  const channelRef = useRef<BroadcastChannel | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') {
      return undefined;
    }

    const channel = new BroadcastChannel(channelName);
    channelRef.current = channel;

    channel.onmessage = (event: MessageEvent<ProgramPlayerBroadcastMessage>) => {
      const data = event.data;
      if (!data || data.sourceId === instanceId) {
        return;
      }
      onMessageRef.current(data);
    };

    return () => {
      channel.close();
      channelRef.current = null;
    };
  }, [channelName]);

  const broadcast = useCallback((message: ProgramPlayerOutgoingMessage) => {
    if (!channelRef.current) {
      return;
    }
    channelRef.current.postMessage({ ...message, sourceId: instanceId });
  }, []);

  return {
    broadcast,
    isSupported: typeof BroadcastChannel !== 'undefined',
  };
}

export function syncSnapshot(
  broadcast: (message: ProgramPlayerOutgoingMessage) => void,
  snapshot: ProgramPlayerSnapshot,
): void {
  broadcast({
    type: 'SYNC',
    payload: {
      ...snapshot,
      timestamp: Date.now(),
    },
  });
}
