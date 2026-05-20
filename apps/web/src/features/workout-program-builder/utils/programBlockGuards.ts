import type {
  CountdownProgramBlock,
  ProgramBlock,
  RestProgramBlock,
  VideoProgramBlock,
  VoiceProgramBlock,
} from '../types/workoutProgramBuilder.types';

export function isVideoBlock(block: ProgramBlock): block is VideoProgramBlock {
  return block.type === 'video';
}

export function isRestBlock(block: ProgramBlock): block is RestProgramBlock {
  return block.type === 'rest';
}

export function isCountdownBlock(block: ProgramBlock): block is CountdownProgramBlock {
  return block.type === 'countdown';
}

export function isVoiceBlock(block: ProgramBlock): block is VoiceProgramBlock {
  return block.type === 'voice';
}
