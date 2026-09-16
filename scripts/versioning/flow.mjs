import {
  DEVELOPMENT_BRANCH,
  PRODUCTION_BRANCHES,
  QA_BRANCH,
  TAG_PATTERN,
  WORKING_BRANCH_PATTERN,
} from './config.mjs';
import { describeVersionRule, isProductionBranch, versionAllowedOnRemote } from './version.mjs';

export function normalizeBranch(ref) {
  return ref
    .replace(/^refs\/heads\//u, '')
    .replace(/^refs\/remotes\/[^/]+\//u, '')
    .replace(/^origin\//u, '');
}

export function isTagRef(ref) {
  return ref.startsWith('refs/tags/');
}

export function tagNameFromRef(ref) {
  return ref.replace(/^refs\/tags\//u, '');
}

export function isWorkingBranch(branch) {
  return WORKING_BRANCH_PATTERN.test(branch);
}

export function isIntegrationBranch(branch) {
  return branch === DEVELOPMENT_BRANCH || branch === QA_BRANCH || isProductionBranch(branch);
}

export function allowedSourcesForRemote(remoteBranch) {
  if (remoteBranch === DEVELOPMENT_BRANCH) {
    return 'a working branch, development, qa, or master (to sync)';
  }

  if (remoteBranch === QA_BRANCH) {
    return 'development or qa';
  }

  if (isProductionBranch(remoteBranch)) {
    return 'qa or master';
  }

  return 'a matching working branch';
}

export function canPushToRemote(localBranch, remoteBranch) {
  if (localBranch === remoteBranch) {
    return true;
  }

  if (remoteBranch === DEVELOPMENT_BRANCH) {
    return (
      isWorkingBranch(localBranch) ||
      localBranch === DEVELOPMENT_BRANCH ||
      localBranch === QA_BRANCH ||
      isProductionBranch(localBranch)
    );
  }

  if (remoteBranch === QA_BRANCH) {
    return localBranch === QA_BRANCH || localBranch === DEVELOPMENT_BRANCH;
  }

  if (isProductionBranch(remoteBranch)) {
    return isProductionBranch(localBranch) || localBranch === QA_BRANCH;
  }

  return isWorkingBranch(localBranch) && !isIntegrationBranch(localBranch);
}

export function assertAllowedPush(localBranch, remoteBranch) {
  if (canPushToRemote(localBranch, remoteBranch)) {
    return;
  }

  throw new Error(
    `Refusing to push ${localBranch} → ${remoteBranch}. ${remoteBranch} only accepts ${allowedSourcesForRemote(remoteBranch)}. Promotion is development → qa → master.`,
  );
}

export function assertVersionForRemote(version, remoteBranch) {
  if (versionAllowedOnRemote(version, remoteBranch)) {
    return;
  }

  throw new Error(
    `package.json version ${version} cannot be pushed to ${remoteBranch}. Expected ${describeVersionRule(remoteBranch)}.`,
  );
}

export function assertValidReleaseTag(tagName) {
  if (TAG_PATTERN.test(tagName)) {
    return;
  }

  throw new Error(
    `Tag "${tagName}" is not allowed. Use vX.Y.Z, vX.Y.Z-development.N, or vX.Y.Z-qa.N.`,
  );
}

export function parsePushLine(line) {
  const parts = line.trim().split(/[ \t]+/u);

  if (parts.length < 4) {
    return undefined;
  }

  const [localRef, localSha, remoteRef, remoteSha] = parts;

  return { localRef, localSha, remoteRef, remoteSha };
}

export function isZeroSha(sha) {
  return Boolean(sha && /^0+$/u.test(sha));
}

export { DEVELOPMENT_BRANCH, PRODUCTION_BRANCHES, QA_BRANCH };
