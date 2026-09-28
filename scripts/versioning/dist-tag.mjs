import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PACKAGE_JSON_PATH } from './config.mjs';
import { git } from './git.mjs';
import { npmDistTag } from './version.mjs';

function repoRoot() {
  return git(['rev-parse', '--show-toplevel']);
}

function main() {
  const pkg = JSON.parse(readFileSync(path.join(repoRoot(), PACKAGE_JSON_PATH), 'utf8'));

  if (typeof pkg.version !== 'string') {
    throw new Error('package.json is missing a version field.');
  }

  process.stdout.write(`${npmDistTag(pkg.version)}\n`);
}

const invokedDirectly =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (invokedDirectly) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
