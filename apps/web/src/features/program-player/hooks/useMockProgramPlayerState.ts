import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { MOCK_PROGRAM_BLOCKS, MOCK_PROGRAM_META } from '../data/mockProgramPlayerData';
import type {
  ProgramPlayerBlock,
  ProgramPlayerBroadcastMessage,
  ProgramPlayerMode,
  ProgramPlayerOutgoingMessage,
  ProgramPlayerSnapshot,
} from '../types/programPlayer.types';
import { syncSnapshot, useProgramPlayerBroadcast } from './useProgramPlayerBroadcast';

interface PlayerState extends ProgramPlayerSnapshot {
  blocks: ProgramPlayerBlock[];
}

type PlayerAction =
  | { type: 'START' }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'NEXT' }
  | { type: 'PREVIOUS' }
  | { type: 'RESTART' }
  | { type: 'COMPLETE' }
  | { type: 'JUMP_TO_BLOCK'; index: number }
  | { type: 'TICK' }
  | { type: 'APPLY_SNAPSHOT'; snapshot: ProgramPlayerSnapshot };

function blockTypeToMode(block: ProgramPlayerBlock | undefined): ProgramPlayerMode {
  if (!block) return 'complete';
  if (block.type === 'rest') return 'rest';
  if (block.type === 'countdown') return 'countdown';
  return 'video';
}

function initialState(): PlayerState {
  return {
    mode: 'start',
    currentIndex: 0,
    isPlaying: false,
    elapsedSec: 0,
    blocks: MOCK_PROGRAM_BLOCKS,
  };
}

function reducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'START':
      return {
        ...state,
        mode: blockTypeToMode(state.blocks[0]),
        currentIndex: 0,
        isPlaying: true,
        elapsedSec: 0,
      };
    case 'PLAY':
      return { ...state, isPlaying: true };
    case 'PAUSE':
      return { ...state, isPlaying: false };
    case 'RESTART':
      return {
        ...state,
        mode: blockTypeToMode(state.blocks[0]),
        currentIndex: 0,
        isPlaying: true,
        elapsedSec: 0,
      };
    case 'COMPLETE':
      return { ...state, mode: 'complete', isPlaying: false };
    case 'JUMP_TO_BLOCK': {
      const index = Math.max(0, Math.min(action.index, state.blocks.length - 1));
      return {
        ...state,
        mode: blockTypeToMode(state.blocks[index]),
        currentIndex: index,
        elapsedSec: 0,
        isPlaying: state.isPlaying,
      };
    }
    case 'NEXT': {
      if (state.mode === 'start') {
        return reducer(state, { type: 'START' });
      }
      const nextIndex = state.currentIndex + 1;
      if (nextIndex >= state.blocks.length) {
        return { ...state, mode: 'complete', isPlaying: false };
      }
      return {
        ...state,
        mode: blockTypeToMode(state.blocks[nextIndex]),
        currentIndex: nextIndex,
        elapsedSec: 0,
      };
    }
    case 'PREVIOUS': {
      if (state.mode === 'start' || state.currentIndex === 0) {
        return state;
      }
      const prevIndex = state.currentIndex - 1;
      return {
        ...state,
        mode: blockTypeToMode(state.blocks[prevIndex]),
        currentIndex: prevIndex,
        elapsedSec: 0,
      };
    }
    case 'TICK': {
      if (!state.isPlaying || state.mode === 'start' || state.mode === 'complete') {
        return state;
      }
      const block = state.blocks[state.currentIndex];
      if (!block) return state;
      const nextElapsed = state.elapsedSec + 1;
      if (nextElapsed >= block.durationSec) {
        return reducer({ ...state, elapsedSec: block.durationSec }, { type: 'NEXT' });
      }
      return { ...state, elapsedSec: nextElapsed };
    }
    case 'APPLY_SNAPSHOT':
      return {
        ...state,
        ...action.snapshot,
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
  };
}

export function useMockProgramPlayerState() {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const suppressBroadcastRef = useRef(false);

  const handleBroadcast = useCallback((message: ProgramPlayerBroadcastMessage) => {
    suppressBroadcastRef.current = true;
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

  const { broadcast, isSupported } = useProgramPlayerBroadcast(handleBroadcast);

  const emit = useCallback(
    (message: ProgramPlayerOutgoingMessage) => {
      broadcast(message);
    },
    [broadcast],
  );

  const dispatchAndBroadcast = useCallback(
    (action: PlayerAction, broadcastType?: ProgramPlayerOutgoingMessage['type']) => {
      dispatch(action);
      if (broadcastType === 'JUMP_TO_BLOCK' && action.type === 'JUMP_TO_BLOCK') {
        emit({ type: 'JUMP_TO_BLOCK', index: action.index });
      } else if (broadcastType && broadcastType !== 'JUMP_TO_BLOCK' && broadcastType !== 'SYNC') {
        emit({ type: broadcastType });
      }
    },
    [emit],
  );

  useEffect(() => {
    if (suppressBroadcastRef.current) return;
    syncSnapshot(emit, toSnapshot(state));
  }, [state, emit]);

  useEffect(() => {
    if (!state.isPlaying || state.mode === 'start' || state.mode === 'complete') {
      return undefined;
    }
    const timer = window.setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => window.clearInterval(timer);
  }, [state.isPlaying, state.mode, state.currentIndex]);

  const currentBlock = state.blocks[state.currentIndex] ?? null;
  const previousBlock = state.currentIndex > 0 ? state.blocks[state.currentIndex - 1] : null;
  const nextBlock =
    state.currentIndex < state.blocks.length - 1 ? state.blocks[state.currentIndex + 1] : null;

  const remainingSec = currentBlock
    ? Math.max(0, currentBlock.durationSec - state.elapsedSec)
    : 0;

  const completedBeforeSec = state.blocks
    .slice(0, state.currentIndex)
    .reduce((sum, block) => sum + block.durationSec, 0);

  const totalElapsedSec = completedBeforeSec + state.elapsedSec;
  const totalRemainingSec = Math.max(0, MOCK_PROGRAM_META.totalDurationSec - totalElapsedSec);
  const progressPercent = Math.min(
    100,
    Math.round((totalElapsedSec / MOCK_PROGRAM_META.totalDurationSec) * 100),
  );

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
      jumpToBlock: (index: number) =>
        dispatchAndBroadcast({ type: 'JUMP_TO_BLOCK', index }, 'JUMP_TO_BLOCK'),
    }),
    [dispatchAndBroadcast, state.isPlaying],
  );

  return {
    meta: MOCK_PROGRAM_META,
    blocks: state.blocks,
    mode: state.mode,
    currentIndex: state.currentIndex,
    currentBlock,
    previousBlock,
    nextBlock,
    isPlaying: state.isPlaying,
    elapsedSec: state.elapsedSec,
    remainingSec,
    totalElapsedSec,
    totalRemainingSec,
    progressPercent,
    isBroadcastSupported: isSupported,
    ...actions,
  };
}

export type MockProgramPlayerState = ReturnType<typeof useMockProgramPlayerState>;
