import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const eslintPattern = /\.(?:ts|tsx|js|jsx|mjs|cjs)$/u;
const prettierPattern = /\.(?:ts|tsx|js|jsx|mjs|cjs|json|md|mdx|css|yml|yaml|html)$/u;
const typecheckPattern = /\.(?:ts|tsx)$/u;

const typecheckConfigPattern =
  /^(?:tsconfig.*\.json|eslint\.config\.ts|vite\.config\.ts|vite\.lib\.config\.ts)$/u;

function isExcluded(file) {
  const normalized = file.replaceAll('\\', '/');

  return normalized === '.storybook/test.html' || normalized.startsWith('.storybook/public/');
}

function git(args) {
  const result = spawnSync('git', args, { encoding: 'utf8' });

  if (result.status !== 0) {
    const detail = result.stderr.trim() || `git ${args.join(' ')} failed`;

    console.error(detail);
    process.exit(result.status === null ? 1 : result.status);
  }

  return result.stdout.trim();
}

function refExists(ref) {
  return spawnSync('git', ['rev-parse', '--verify', '--quiet', ref]).status === 0;
}

function defaultMainRef() {
  const candidates = ['origin/main', 'origin/master', 'main', 'master'];

  return candidates.find((ref) => refExists(ref));
}

function prTargetRef() {
  const azureTarget = process.env.SYSTEM_PULLREQUEST_TARGETBRANCH;
  const githubTarget = process.env.GITHUB_BASE_REF;

  if (azureTarget) {
    return `origin/${azureTarget.replace(/^refs\/heads\//u, '')}`;
  }

  if (githubTarget) {
    return `origin/${githubTarget.replace(/^refs\/heads\//u, '')}`;
  }

  return undefined;
}

function isDefaultBranch() {
  const source = process.env.BUILD_SOURCEBRANCH ?? '';
  const current = git(['rev-parse', '--abbrev-ref', 'HEAD']);

  return (
    source === 'refs/heads/main' ||
    source === 'refs/heads/master' ||
    current === 'main' ||
    current === 'master'
  );
}

function resolveBase() {
  const prTarget = prTargetRef();

  if (prTarget) {
    if (!refExists(prTarget)) {
      console.error(
        `PR target ${prTarget} is not available. Fetch it before running check:changed.`,
      );
      process.exit(1);
    }

    return prTarget;
  }

  if (isDefaultBranch()) {
    return refExists('HEAD^') ? 'HEAD^' : undefined;
  }

  const mainRef = defaultMainRef();

  if (mainRef) {
    return git(['merge-base', mainRef, 'HEAD']);
  }

  return refExists('HEAD^') ? 'HEAD^' : undefined;
}

function uniqueExisting(files) {
  return [...new Set(files)].filter(
    (file) => file.length > 0 && !isExcluded(file) && existsSync(file),
  );
}

function diffNames(...args) {
  const output = git(['diff', '--name-only', '--diff-filter=ACMR', ...args]);

  return output.length === 0 ? [] : output.split('\n');
}

function changedFiles(base) {
  return uniqueExisting([...diffNames(`${base}...HEAD`), ...diffNames('--cached'), ...diffNames()]);
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit' });

  if (result.status !== 0) {
    process.exit(result.status === null ? 1 : result.status);
  }
}

const base = resolveBase();

if (!base) {
  console.error('Unable to resolve a git base for changed-file checks.');
  process.exit(1);
}

const files = changedFiles(base);

if (files.length === 0) {
  console.error(`No changed files vs ${base}; skipping ESLint, Prettier, and typecheck.`);
  process.exit(0);
}

console.error(`Checking ${String(files.length)} changed file(s) vs ${base} (no --fix).`);

const eslintFiles = files.filter((file) => eslintPattern.test(file));
const prettierFiles = files.filter((file) => prettierPattern.test(file));

const needsTypecheck = files.some(
  (file) => typecheckPattern.test(file) || typecheckConfigPattern.test(file),
);

if (eslintFiles.length > 0) {
  run('npm', ['exec', '--', 'eslint', '--max-warnings=0', '--', ...eslintFiles]);
}

if (prettierFiles.length > 0) {
  run('npm', ['exec', '--', 'prettier', '--check', '--ignore-unknown', '--', ...prettierFiles]);
}

if (needsTypecheck) {
  run('npm', ['run', 'typecheck']);
}
