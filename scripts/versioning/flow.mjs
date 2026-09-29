import {
  DEVELOPMENT_BRANCH,
  isNamedReleaseBranch,
  isQaPromoteBranch,
  PRODUCTION_BRANCHES,
  PROMOTION_HINT,
  QA_BRANCH,
  TAG_PATTERN,
  TAG_PREFIX,
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
    return 'a working branch, development, or master (to sync)';
  }

  if (remoteBranch === QA_BRANCH) {
    return 'a qa/<slug> or qa:<slug> cherry-pick branch (created from qa)';
  }

  if (isProductionBranch(remoteBranch)) {
    return 'a release/<slug> or release:<slug> branch (created from master)';
  }

  if (isQaPromoteBranch(remoteBranch)) {
    return 'the same qa cherry-pick branch';
  }

  if (isNamedReleaseBranch(remoteBranch)) {
    return 'the same release branch';
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
      isProductionBranch(localBranch)
    );
  }

  if (remoteBranch === QA_BRANCH) {
    return localBranch === QA_BRANCH || isQaPromoteBranch(localBranch);
  }

  if (isProductionBranch(remoteBranch)) {
    return isProductionBranch(localBranch) || isNamedReleaseBranch(localBranch);
  }

  if (isQaPromoteBranch(remoteBranch) || isNamedReleaseBranch(remoteBranch)) {
    return false;
  }

  return isWorkingBranch(localBranch) && !isIntegrationBranch(localBranch);
}

export function assertAllowedPush(localBranch, remoteBranch) {
  if (canPushToRemote(localBranch, remoteBranch)) {
    return;
  }

  throw new Error(
    `Refusing to push ${localBranch} → ${remoteBranch}. ${remoteBranch} only accepts ${allowedSourcesForRemote(remoteBranch)}. ${PROMOTION_HINT}`,
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
    `Tag "${tagName}" is not allowed. Use vX.Y.Z, vX.Y.Z-qa.N, or vX.Y.Z-<release-slug>.N.`,
  );
}

export function assertTagMatchesVersion(tagName, version) {
  assertValidReleaseTag(tagName);

  const expected = `${TAG_PREFIX}${version}`;

  if (tagName !== expected) {
    throw new Error(
      `Tag ${tagName} does not match package.json version ${version} (expected ${expected}).`,
    );
  }
}

export function requiredBaseBranch(branch) {
  if (isQaPromoteBranch(branch)) {
    return QA_BRANCH;
  }

  if (isNamedReleaseBranch(branch)) {
    return 'master';
  }

  return undefined;
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

export {
  DEVELOPMENT_BRANCH,
  isNamedReleaseBranch,
  isQaPromoteBranch,
  PRODUCTION_BRANCHES,
  QA_BRANCH,
};
