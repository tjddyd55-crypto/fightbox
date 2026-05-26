import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import type {
  ProgramPlayerBlock,
  ProgramPlayerBroadcastMessage,
  ProgramPlayerMode,
  ProgramPlayerOutgoingMessage,
  ProgramPlayerProgram,
  ProgramPlayerSnapshot,
} from '../types/programPlayer.types';
import { buildProgramMeta } from '../utils/programPlayerMeta';
import { usesVideoEndedForAdvance } from '../utils/programPlayerPlaybackUtils';
import {
  getProgramBlockDurationSec,
  getProgramTotalDurationSec,
} from '../utils/programPlayerTimeUtils';
import {
  buildProgramPlayerBroadcastChannel,
  syncSnapshot,
  useProgramPlayerBroadcast,
} from './useProgramPlayerBroadcast';

interface PlayerState extends ProgramPlayerSnapshot {
  blocks: ProgramPlayerBlock[];
  programId: string;
  totalDurationSec: number;
  lastTickAt: number | null;
  currentRepeatIndex: number;
}

type PlayerAction =
  | { type: 'START' }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'NEXT' }
  | { type: 'PREVIOUS' }
  | { type: 'RESTART' }
  | { type: 'COMPLETE' }
  | { type: 'RETURN_TO_START' }
  | { type: 'JUMP_TO_BLOCK'; index: number }
  | { type: 'TICK' }
  | { type: 'VIDEO_LOOP_COMPLETE' }
  | { type: 'APPLY_SNAPSHOT'; snapshot: ProgramPlayerSnapshot }
  | { type: 'RESET'; program: ProgramPlayerProgram };

function blockTypeToMode(block: ProgramPlayerBlock | undefined): ProgramPlayerMode {
  if (!block) return 'complete';
  if (block.type === 'rest') return 'rest';
  if (block.type === 'countdown') return 'countdown';
  if (block.type === 'voice') return 'voice';
  return 'video';
}

function withRepeatReset(state: PlayerState, patch: Partial<PlayerState>): PlayerState {
  return { ...state, ...patch, currentRepeatIndex: 1 };
}

function normalizeBlocks(blocks: ProgramPlayerBlock[]): ProgramPlayerBlock[] {
  return blocks.map((block) => ({
    ...block,
    durationSec: getProgramBlockDurationSec(block),
  }));
}

function singleLoopDurationSec(block: ProgramPlayerBlock): number {
  if (block.type !== 'video') return getProgramBlockDurationSec(block);
  const loop = block.singleLoopDurationSec;
  if (loop && loop > 0) return loop;
  const repeats = Math.max(1, block.repeatCount ?? 1);
  return Math.max(1, Math.floor(getProgramBlockDurationSec(block) / repeats));
}

function createInitialState(program: ProgramPlayerProgram): PlayerState {
  const blocks = normalizeBlocks(program.blocks);
  const totalDurationSec =
    program.totalDurationSec > 0
      ? program.totalDurationSec
      : getProgramTotalDurationSec(blocks);

  return {
    mode: 'start',
    currentIndex: 0,
    isPlaying: false,
    elapsedSec: 0,
    currentRepeatIndex: 1,
    blocks,
    programId: program.id,
    totalDurationSec,
    lastTickAt: null,
  };
}

function blockDuration(state: PlayerState, index: number): number {
  const block = state.blocks[index];
  return block ? getProgramBlockDurationSec(block) : 0;
}

function completeState(state: PlayerState): PlayerState {
  const lastIndex = Math.max(0, state.blocks.length - 1);
  const duration = blockDuration(state, lastIndex);
  return {
    ...state,
    mode: 'complete',
    isPlaying: false,
    currentIndex: lastIndex,
    elapsedSec: duration,
    currentRepeatIndex: 1,
    lastTickAt: null,
  };
}

function reducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'RESET':
      return createInitialState(action.program);
    case 'START':
      return withRepeatReset(state, {
        mode: blockTypeToMode(state.blocks[0]),
        currentIndex: 0,
        isPlaying: true,
        elapsedSec: 0,
        lastTickAt: Date.now(),
      });
    case 'PLAY':
      return { ...state, isPlaying: true, lastTickAt: Date.now() };
    case 'PAUSE':
      return { ...state, isPlaying: false, lastTickAt: null };
    case 'RESTART':
      return withRepeatReset(state, {
        mode: blockTypeToMode(state.blocks[0]),
        currentIndex: 0,
        isPlaying: true,
        elapsedSec: 0,
        lastTickAt: Date.now(),
      });
    case 'RETURN_TO_START':
      return withRepeatReset(state, {
        mode: 'start',
        currentIndex: 0,
        isPlaying: false,
        elapsedSec: 0,
        lastTickAt: null,
      });
    case 'COMPLETE':
      return completeState(state);
    case 'JUMP_TO_BLOCK': {
      const index = Math.max(0, Math.min(action.index, state.blocks.length - 1));
      return withRepeatReset(state, {
        mode: blockTypeToMode(state.blocks[index]),
        currentIndex: index,
        elapsedSec: 0,
        isPlaying: state.isPlaying,
        lastTickAt: state.isPlaying ? Date.now() : null,
      });
    }
    case 'VIDEO_LOOP_COMPLETE': {
      const block = state.blocks[state.currentIndex];
      if (!block || block.type !== 'video' || !usesVideoEndedForAdvance(block)) {
        return state;
      }
      const target = Math.max(1, block.repeatCount ?? 1);
      if (state.currentRepeatIndex < target) {
        return {
          ...state,
          currentRepeatIndex: state.currentRepeatIndex + 1,
          elapsedSec: 0,
          lastTickAt: state.isPlaying ? Date.now() : null,
        };
      }
      return reducer(
        { ...state, elapsedSec: getProgramBlockDurationSec(block), lastTickAt: Date.now() },
        { type: 'NEXT' },
      );
    }
    case 'NEXT': {
      if (state.mode === 'start') {
        return reducer(state, { type: 'START' });
      }
      const nextIndex = state.currentIndex + 1;
      if (nextIndex >= state.blocks.length) {
        return completeState({ ...state, elapsedSec: blockDuration(state, state.currentIndex) });
      }
      return withRepeatReset(state, {
        mode: blockTypeToMode(state.blocks[nextIndex]),
        currentIndex: nextIndex,
        elapsedSec: 0,
        lastTickAt: state.isPlaying ? Date.now() : state.lastTickAt,
      });
    }
    case 'PREVIOUS': {
      if (state.mode === 'start' || state.mode === 'complete') {
        return state;
      }
      if (state.elapsedSec > 3) {
        return withRepeatReset(state, {
          elapsedSec: 0,
          lastTickAt: state.isPlaying ? Date.now() : null,
        });
      }
      if (state.currentIndex === 0) {
        return withRepeatReset(state, {
          mode: 'start',
          isPlaying: false,
          elapsedSec: 0,
          lastTickAt: null,
        });
      }
      const prevIndex = state.currentIndex - 1;
      return withRepeatReset(state, {
        mode: blockTypeToMode(state.blocks[prevIndex]),
        currentIndex: prevIndex,
        elapsedSec: 0,
        lastTickAt: state.isPlaying ? Date.now() : null,
      });
    }
    case 'TICK': {
      if (!state.isPlaying || state.mode === 'start' || state.mode === 'complete') {
        return state;
      }
      const block = state.blocks[state.currentIndex];
      if (!block) return state;

      const durationSec = getProgramBlockDurationSec(block);
      const nextElapsed = state.elapsedSec + 1;

      if (
        block.type === 'video' &&
        usesVideoEndedForAdvance(block) &&
        nextElapsed >= singleLoopDurationSec(block)
      ) {
        return reducer(state, { type: 'VIDEO_LOOP_COMPLETE' });
      }

      if (nextElapsed >= durationSec) {
        return reducer(
          { ...state, elapsedSec: durationSec, lastTickAt: Date.now() },
          { type: 'NEXT' },
        );
      }

      return {
        ...state,
        elapsedSec: nextElapsed,
        lastTickAt: Date.now(),
      };
    }
    case 'APPLY_SNAPSHOT':
      return {
        ...state,
        mode: action.snapshot.mode,
        currentIndex: action.snapshot.currentIndex,
        isPlaying: action.snapshot.isPlaying,
        elapsedSec: action.snapshot.elapsedSec,
        currentRepeatIndex: action.snapshot.currentRepeatIndex ?? 1,
        lastTickAt: action.snapshot.isPlaying ? Date.now() : null,
      };
    default:
      return state;
  }
}

function toSnapshot(state: PlayerState): ProgramPlayerSnapshot {
  return {
    mode: state.mode,
    currentIndex: state.currentIndex,
    isPlaying: state.isPlaying,
    elapsedSec: state.elapsedSec,
    currentRepeatIndex: state.currentRepeatIndex,
  };
}

export function useProgramPlayerState(program: ProgramPlayerProgram) {
  const [state, dispatch] = useReducer(reducer, program, createInitialState);
  const suppressBroadcastRef = useRef(false);
  const skipSyncEffectRef = useRef(false);
  const videoLoopGuardRef = useRef<{ blockId: string; repeatIndex: number } | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    dispatch({ type: 'RESET', program });
  }, [program]);

  useEffect(() => {
    videoLoopGuardRef.current = null;
  }, [state.currentIndex, state.blocks[state.currentIndex]?.id]);

  const channelName = useMemo(
    () => buildProgramPlayerBroadcastChannel(program.id, program.source),
    [program.id, program.source],
  );

  const handleBroadcast = useCallback((message: ProgramPlayerBroadcastMessage) => {
    suppressBroadcastRef.current = true;
    skipSyncEffectRef.current = true;
    switch (message.type) {
      case 'SYNC':
        dispatch({ type: 'APPLY_SNAPSHOT', snapshot: message.payload });
        break;
      case 'START':
        dispatch({ type: 'START' });
        break;
      case 'PLAY':
        dispatch({ type: 'PLAY' });
        break;
      case 'PAUSE':
        dispatch({ type: 'PAUSE' });
        break;
      case 'NEXT':
        dispatch({ type: 'NEXT' });
        break;
      case 'PREVIOUS':
        dispatch({ type: 'PREVIOUS' });
        break;
      case 'RESTART':
        dispatch({ type: 'RESTART' });
        break;
      case 'COMPLETE':
        dispatch({ type: 'COMPLETE' });
        break;
      case 'RETURN_TO_START':
        dispatch({ type: 'RETURN_TO_START' });
        break;
      case 'JUMP_TO_BLOCK':
        dispatch({ type: 'JUMP_TO_BLOCK', index: message.index });
        break;
      default:
        break;
    }
    queueMicrotask(() => {
      suppressBroadcastRef.current = false;
    });
  }, []);

  const { broadcast, isSupported } = useProgramPlayerBroadcast(channelName, handleBroadcast);

  const emit = useCallback(
    (message: ProgramPlayerOutgoingMessage) => {
      broadcast(message);
    },
    [broadcast],
  );

  const emitSync = useCallback(() => {
    if (suppressBroadcastRef.current) return;
    syncSnapshot(emit, toSnapshot(stateRef.current));
  }, [emit]);

  const dispatchAndBroadcast = useCallback(
    (action: PlayerAction, broadcastType?: ProgramPlayerOutgoingMessage['type']) => {
      dispatch(action);
      if (broadcastType === 'JUMP_TO_BLOCK' && action.type === 'JUMP_TO_BLOCK') {
        emit({ type: 'JUMP_TO_BLOCK', index: action.index });
      } else if (broadcastType === 'RETURN_TO_START') {
        emit({ type: 'RETURN_TO_START' });
      } else if (broadcastType && broadcastType !== 'JUMP_TO_BLOCK' && broadcastType !== 'SYNC') {
        emit({ type: broadcastType });
      }
      queueMicrotask(emitSync);
    },
    [emit, emitSync],
  );

  useEffect(() => {
    if (skipSyncEffectRef.current) {
      skipSyncEffectRef.current = false;
      return;
    }
    if (suppressBroadcastRef.current) {
      return;
    }
    emitSync();
  }, [state.currentIndex, state.mode, emitSync]);

  useEffect(() => {
    if (!state.isPlaying || state.mode === 'start' || state.mode === 'complete') {
      return undefined;
    }

    const timer = window.setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => window.clearInterval(timer);
  }, [state.isPlaying, state.mode, state.currentIndex]);

  useEffect(() => {
    if (!state.isPlaying || state.mode === 'start' || state.mode === 'complete') {
      return undefined;
    }

    const syncTimer = window.setInterval(emitSync, 5000);
    return () => window.clearInterval(syncTimer);
  }, [state.isPlaying, state.mode, state.currentIndex, emitSync]);

  const currentBlock = state.blocks[state.currentIndex] ?? null;
  const previousBlock = state.currentIndex > 0 ? state.blocks[state.currentIndex - 1] : null;
  const nextBlock =
    state.currentIndex < state.blocks.length - 1 ? state.blocks[state.currentIndex + 1] : null;

  const currentBlockDurationSec = currentBlock ? getProgramBlockDurationSec(currentBlock) : 0;

  const remainingSec = currentBlock
    ? Math.max(0, currentBlockDurationSec - state.elapsedSec)
    : 0;

  const completedBeforeSec = state.blocks
    .slice(0, state.currentIndex)
    .reduce((sum, block) => sum + getProgramBlockDurationSec(block), 0);

  const totalElapsedSec =
    state.mode === 'complete'
      ? state.totalDurationSec
      : completedBeforeSec + state.elapsedSec;

  const totalDurationSec = Math.max(state.totalDurationSec, 1);
  const totalRemainingSec =
    state.mode === 'complete' ? 0 : Math.max(0, totalDurationSec - totalElapsedSec);
  const progressPercent =
    state.mode === 'complete'
      ? 100
      : Math.min(100, Math.round((totalElapsedSec / totalDurationSec) * 100));

  const blockProgressPercent =
    currentBlock && currentBlockDurationSec > 0
      ? Math.min(100, Math.round((state.elapsedSec / currentBlockDurationSec) * 100))
      : 0;

  const currentRepeatCount =
    currentBlock?.type === 'video' ? Math.max(1, currentBlock.repeatCount ?? 1) : 1;

  const blockRemainingSec = remainingSec;

  const completedBlockCount =
    state.mode === 'complete' ? state.blocks.length : state.currentIndex;

  const actions = useMemo(
    () => ({
      start: () => dispatchAndBroadcast({ type: 'START' }, 'START'),
      play: () => dispatchAndBroadcast({ type: 'PLAY' }, 'PLAY'),
      pause: () => dispatchAndBroadcast({ type: 'PAUSE' }, 'PAUSE'),
      togglePlay: () =>
        state.isPlaying
          ? dispatchAndBroadcast({ type: 'PAUSE' }, 'PAUSE')
          : dispatchAndBroadcast({ type: 'PLAY' }, 'PLAY'),
      next: () => dispatchAndBroadcast({ type: 'NEXT' }, 'NEXT'),
      previous: () => dispatchAndBroadcast({ type: 'PREVIOUS' }, 'PREVIOUS'),
      restart: () => dispatchAndBroadcast({ type: 'RESTART' }, 'RESTART'),
      complete: () => dispatchAndBroadcast({ type: 'COMPLETE' }, 'COMPLETE'),
      exitToStart: () => dispatchAndBroadcast({ type: 'RETURN_TO_START' }, 'RETURN_TO_START'),
      jumpToBlock: (index: number) =>
        dispatchAndBroadcast({ type: 'JUMP_TO_BLOCK', index }, 'JUMP_TO_BLOCK'),
      onVideoLoopComplete: () => {
        const snapshot = stateRef.current;
        const block = snapshot.blocks[snapshot.currentIndex];
        if (!block || block.type !== 'video' || !usesVideoEndedForAdvance(block)) {
          return;
        }
        const guard = { blockId: block.id, repeatIndex: snapshot.currentRepeatIndex };
        if (
          videoLoopGuardRef.current?.blockId === guard.blockId &&
          videoLoopGuardRef.current?.repeatIndex === guard.repeatIndex
        ) {
          return;
        }
        videoLoopGuardRef.current = guard;
        dispatch({ type: 'VIDEO_LOOP_COMPLETE' });
      },
      onVideoOriginalEnded: () => {
        const snapshot = stateRef.current;
        const block = snapshot.blocks[snapshot.currentIndex];
        if (!block || block.type !== 'video' || block.playbackMode !== 'original_duration') {
          return;
        }
        const durationSec = getProgramBlockDurationSec(block);
        if (snapshot.elapsedSec >= durationSec) {
          return;
        }
        dispatch({ type: 'NEXT' });
      },
    }),
    [dispatchAndBroadcast, state.isPlaying],
  );

  const meta = useMemo(() => buildProgramMeta(program), [program]);

  return {
    program,
    meta,
    blocks: state.blocks,
    mode: state.mode,
    currentIndex: state.currentIndex,
    currentBlock,
    previousBlock,
    nextBlock,
    isPlaying: state.isPlaying,
    elapsedSec: state.elapsedSec,
    remainingSec,
    blockRemainingSec,
    totalElapsedSec,
    totalRemainingSec,
    progressPercent,
    blockProgressPercent,
    currentRepeatIndex: state.currentRepeatIndex,
    currentRepeatCount,
    completedBlockCount,
    lastTickAt: state.lastTickAt,
    isBroadcastSupported: isSupported,
    ...actions,
  };
}

export type ProgramPlayerState = ReturnType<typeof useProgramPlayerState>;
