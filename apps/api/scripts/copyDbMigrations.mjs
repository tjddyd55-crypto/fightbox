import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const apiRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = join(apiRoot, 'src/db/migrations');
const targetDir = join(apiRoot, 'dist/db/migrations');

if (!existsSync(sourceDir)) {
  throw new Error(`Missing migrations source directory: ${sourceDir}`);
}

mkdirSync(targetDir, { recursive: true });
cpSync(sourceDir, targetDir, { recursive: true });
console.info(`[build] copied migrations to ${targetDir}`);
