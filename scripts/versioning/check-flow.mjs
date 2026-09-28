import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PACKAGE_JSON_PATH } from './config.mjs';
import {
  assertAllowedPush,
  assertTagMatchesVersion,
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
    ci: argv.includes('--ci'),
  };
}

export function resolveCiContext(env) {
  const prSource = env.SYSTEM_PULLREQUEST_SOURCEBRANCH;
  const prTarget = env.SYSTEM_PULLREQUEST_TARGETBRANCH;
  const buildSource = env.BUILD_SOURCEBRANCH ?? '';

  if (prSource && prTarget) {
    return {
      kind: 'pull-request',
      source: normalizeBranch(prSource),
      target: normalizeBranch(prTarget),
    };
  }

  if (isTagRef(buildSource)) {
    return {
      kind: 'tag',
      tagName: tagNameFromRef(buildSource),
    };
  }

  if (buildSource.startsWith('refs/heads/')) {
    return {
      kind: 'branch',
      branch: normalizeBranch(buildSource),
    };
  }

  return { kind: 'local' };
}

export function assertCiContext(context, version) {
  if (context.kind === 'pull-request') {
    assertAllowedPush(context.source, context.target);

    if (isIntegrationBranch(context.target)) {
      assertVersionForRemote(version, context.target);
    }

    return `pull request ${context.source} → ${context.target} (${version})`;
  }

  if (context.kind === 'tag') {
    assertTagMatchesVersion(context.tagName, version);

    return `tag ${context.tagName} (${version})`;
  }

  if (context.kind === 'branch') {
    if (isIntegrationBranch(context.branch)) {
      assertVersionForRemote(version, context.branch);
    }

    return `branch ${context.branch} (${version})`;
  }

  return undefined;
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

function checkAzureCi(env) {
  const context = resolveCiContext(env);
  const version = readPackageVersion(repoRoot());
  const summary = assertCiContext(context, version);

  if (!summary) {
    checkCurrentBranch();

    return;
  }

  console.error(`version:check passed for ${summary}.`);
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

  if (options.ci) {
    checkAzureCi(process.env);

    return;
  }

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
