import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PACKAGE_JSON_PATH, PROMOTION_HINT } from './config.mjs';
import {
  assertAllowedPush,
  assertTagMatchesVersion,
  assertValidReleaseTag,
  assertVersionForRemote,
  isIntegrationBranch,
  isNamedReleaseBranch,
  isQaPromoteBranch,
  isTagRef,
  isZeroSha,
  normalizeBranch,
  parsePushLine,
  requiredBaseBranch,
  tagNameFromRef,
} from './flow.mjs';
import { currentBranch, git, isGitAncestor, packageVersionAt, refExists } from './git.mjs';

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

    if (isIntegrationBranch(context.target) || isNamedReleaseBranch(context.target)) {
      assertVersionForRemote(version, context.target);
    }

    return `pull request ${context.source} → ${context.target} (${version})`;
  }

  if (context.kind === 'tag') {
    assertTagMatchesVersion(context.tagName, version);

    return `tag ${context.tagName} (${version})`;
  }

  if (context.kind === 'branch') {
    if (
      isIntegrationBranch(context.branch) ||
      isNamedReleaseBranch(context.branch) ||
      isQaPromoteBranch(context.branch)
    ) {
      assertVersionForRemote(version, context.branch);
    }

    return `branch ${context.branch} (${version})`;
  }

  return undefined;
}

function baseRefCandidates(base) {
  if (base === 'master') {
    return ['origin/master', 'master', 'origin/main', 'main'];
  }

  return [`origin/${base}`, base];
}

export function assertCreatedFromBase(branch, sha) {
  const base = requiredBaseBranch(branch);

  if (!base) {
    return;
  }

  const known = baseRefCandidates(base).find((ref) => refExists(ref));

  if (!known) {
    console.error(
      `Warning: could not verify ${branch} was created from ${base} (missing ${base} ref).`,
    );

    return;
  }

  const descendant = sha && !isZeroSha(sha) ? sha : 'HEAD';
  const ancestor = isGitAncestor(known, descendant);

  if (ancestor === false) {
    throw new Error(`${branch} must be created from ${base}, then cherry-pick. ${PROMOTION_HINT}`);
  }
}

function checkCurrentBranch() {
  const branch = currentBranch();
  const version = readPackageVersion(repoRoot());

  if (isNamedReleaseBranch(branch) || isQaPromoteBranch(branch) || isIntegrationBranch(branch)) {
    assertVersionForRemote(version, branch);
    assertCreatedFromBase(branch, 'HEAD');
    console.error(`version:check passed on ${branch} (${version}).`);

    return;
  }

  console.error(`version:check passed on working branch ${branch} (${version}).`);
}

function checkAzureCi(env) {
  git(['fetch', '--quiet', 'origin', 'development', 'qa', 'master', 'main'], { allowFail: true });

  const context = resolveCiContext(env);
  const version = readPackageVersion(repoRoot());
  const summary = assertCiContext(context, version);

  if (context.kind === 'pull-request') {
    assertCreatedFromBase(context.source, env.SYSTEM_PULLREQUEST_SOURCECOMMITID ?? 'HEAD');
  }

  if (context.kind === 'branch') {
    assertCreatedFromBase(context.branch, 'HEAD');
  }

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
    assertCreatedFromBase(localBranch, parsed.localSha);

    const version = packageVersionAt(parsed.localSha) ?? readPackageVersion(repoRoot());

    if (
      isIntegrationBranch(remoteBranch) ||
      isNamedReleaseBranch(remoteBranch) ||
      isQaPromoteBranch(remoteBranch)
    ) {
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
