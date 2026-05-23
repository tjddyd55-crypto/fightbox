import { createMockProgram } from '../utils/programPlayerDataAdapter';
import { useProgramPlayerState } from './useProgramPlayerState';

const MOCK_PROGRAM = createMockProgram();

export function useMockProgramPlayerState() {
  return useProgramPlayerState(MOCK_PROGRAM);
}

export type MockProgramPlayerState = ReturnType<typeof useMockProgramPlayerState>;
