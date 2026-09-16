import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PACKAGE_JSON_PATH } from './config.mjs';
import {
  assertAllowedPush,
  assertValidReleaseTag,
  assertVersionForRemote,
  isIntegrationBranch,
  isTagRef,
  isZeroSha,
  normalizeBranch,
  parsePushLine,
  tagNameFromRef,
} from './flow.mjs';
import { currentBranch, git, packageVersionAt } from './git.mjs';

function fail(message) {
  console.error(message);
  process.exit(1);
}

function repoRoot() {
  return git(['rev-parse', '--show-toplevel']);
}

function readPackageVersion(rootDir) {
  const pkg = JSON.parse(readFileSync(path.join(rootDir, PACKAGE_JSON_PATH), 'utf8'));

  if (typeof pkg.version !== 'string') {
    throw new Error('package.json is missing a version field.');
  }

  return pkg.version;
}

function parseArgs(argv) {
  return {
    prePush: argv.includes('--pre-push'),
  };
}

function checkCurrentBranch() {
  const branch = currentBranch();
  const version = readPackageVersion(repoRoot());

  if (!isIntegrationBranch(branch)) {
    console.error(`version:check passed on working branch ${branch} (${version}).`);

    return;
  }

  assertVersionForRemote(version, branch);
  console.error(`version:check passed on ${branch} (${version}).`);
}

function checkPrePush(input) {
  const lines = input
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    checkCurrentBranch();

    return;
  }

  for (const line of lines) {
    const parsed = parsePushLine(line);

    if (!parsed) {
      continue;
    }

    if (isZeroSha(parsed.localSha)) {
      continue;
    }

    if (isTagRef(parsed.remoteRef)) {
      assertValidReleaseTag(tagNameFromRef(parsed.remoteRef));
      continue;
    }

    if (!parsed.remoteRef.startsWith('refs/heads/')) {
      continue;
    }

    const remoteBranch = normalizeBranch(parsed.remoteRef);

    const localBranch =
      parsed.localRef === 'HEAD' || parsed.localRef === '(delete)'
        ? currentBranch()
        : normalizeBranch(parsed.localRef);

    assertAllowedPush(localBranch, remoteBranch);

    const version = packageVersionAt(parsed.localSha) ?? readPackageVersion(repoRoot());

    if (isIntegrationBranch(remoteBranch)) {
      assertVersionForRemote(version, remoteBranch);
    }
  }

  console.error('version:check passed for the refs being pushed.');
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (!options.prePush) {
    checkCurrentBranch();

    return;
  }

  const chunks = [];

  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }

  checkPrePush(chunks.join(''));
}

const invokedDirectly =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (invokedDirectly) {
  main().catch((error) => {
    fail(error instanceof Error ? error.message : String(error));
  });
}
