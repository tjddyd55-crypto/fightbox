import type { ProgramPlayerMeta, ProgramPlayerProgram } from '../types/programPlayer.types';

export function buildProgramMeta(program: ProgramPlayerProgram): ProgramPlayerMeta {
  const video = program.blocks.filter((block) => block.type === 'video').length;
  const rest = program.blocks.filter((block) => block.type === 'rest').length;
  const countdown = program.blocks.filter((block) => block.type === 'countdown').length;
  const flowPreview =
    program.blocks.length > 0
      ? program.blocks
          .slice(0, 8)
          .map((block) => block.title.split(' ')[0])
          .join(' → ')
      : '';

  return {
    title: program.title,
    totalDurationSec: program.totalDurationSec,
    totalBlocks: program.blocks.length,
    summary: { video, rest, countdown },
    flowPreview,
  };
}
