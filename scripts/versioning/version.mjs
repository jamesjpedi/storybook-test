import semver from 'semver';

import {
  CHANNEL_DEVELOPMENT,
  CHANNEL_QA,
  DEVELOPMENT_BRANCH,
  isNamedReleaseBranch,
  isQaPromoteBranch,
  namedReleaseSlug,
  PRODUCTION_BRANCHES,
  QA_BRANCH,
} from './config.mjs';

export function isProductionBranch(branch) {
  return PRODUCTION_BRANCHES.includes(branch);
}

export function canCutRelease(branch) {
  return (
    branch === DEVELOPMENT_BRANCH ||
    branch === QA_BRANCH ||
    isProductionBranch(branch) ||
    isNamedReleaseBranch(branch)
  );
}

export function sanitizePrereleaseId(raw) {
  const slug = raw
    .trim()
    .toLowerCase()
    .replaceAll(/[^a-z0-9-]+/gu, '-')
    .replaceAll(/^-+|-+$/gu, '');

  if (!slug || !/^[a-z][a-z0-9-]*$/u.test(slug)) {
    throw new Error(
      `Prerelease id "${raw}" must start with a letter and use only letters, digits, and hyphens.`,
    );
  }

  return slug;
}

export function namedReleaseChannel(branch) {
  const slug = namedReleaseSlug(branch);

  if (!slug) {
    return undefined;
  }

  return sanitizePrereleaseId(slug);
}

export function channelOf(version) {
  const parsed = semver.parse(version);

  if (!parsed) {
    return undefined;
  }

  const [identifier, number] = parsed.prerelease;

  if (identifier === undefined) {
    return 'production';
  }

  if (
    typeof identifier === 'string' &&
    typeof number === 'number' &&
    parsed.prerelease.length === 2
  ) {
    return identifier;
  }

  return undefined;
}

export function coreVersion(version) {
  const parsed = semver.parse(version);

  if (!parsed) {
    return undefined;
  }

  return `${String(parsed.major)}.${String(parsed.minor)}.${String(parsed.patch)}`;
}

function incrementPrerelease(version, channel) {
  const parsed = semver.parse(version);

  if (!parsed) {
    throw new Error(`Invalid version "${version}".`);
  }

  const [identifier, number] = parsed.prerelease;

  if (identifier !== channel || typeof number !== 'number') {
    throw new Error(`Version "${version}" is not a ${channel} prerelease.`);
  }

  return `${coreVersion(version)}-${channel}.${String(number + 1)}`;
}

function bumpCore(current, bump) {
  const base = coreVersion(current) ?? current;
  const next = semver.inc(base, bump);

  if (!next) {
    throw new Error(`Could not apply ${bump} bump to "${current}".`);
  }

  return next;
}

function requireStableReleaseAs(releaseAs, branch) {
  if (!releaseAs) {
    return;
  }

  const parsedReleaseAs = semver.parse(releaseAs);

  if (!parsedReleaseAs || parsedReleaseAs.prerelease.length > 0) {
    throw new Error(`--release-as must be a stable x.y.z version (got "${releaseAs}").`);
  }

  if (branch !== DEVELOPMENT_BRANCH && branch !== QA_BRANCH && !isNamedReleaseBranch(branch)) {
    throw new Error('--release-as is only used on development, qa, or a release:<slug> branch.');
  }
}

function nextPrerelease({ current, channel, bump, releaseAs }) {
  const currentChannel = channelOf(current);

  if (currentChannel === channel) {
    if (releaseAs && coreVersion(current) !== coreVersion(releaseAs) && coreVersion(releaseAs)) {
      return `${coreVersion(releaseAs)}-${channel}.1`;
    }

    return incrementPrerelease(current, channel);
  }

  const nextCore = coreVersion(releaseAs) ?? bumpCore(current, bump ?? 'patch');

  return `${nextCore}-${channel}.1`;
}

export function nextVersion({ current, branch, bump, releaseAs }) {
  if (!semver.valid(current)) {
    throw new Error(`package.json version "${current}" is not valid semver.`);
  }

  requireStableReleaseAs(releaseAs, branch);

  const currentChannel = channelOf(current);

  if (semver.parse(current)?.prerelease.length && !currentChannel) {
    throw new Error(
      `Unsupported prerelease in "${current}". Use x.y.z-development.N, x.y.z-qa.N, or x.y.z-<release-slug>.N.`,
    );
  }

  if (branch === DEVELOPMENT_BRANCH) {
    return nextPrerelease({ current, channel: CHANNEL_DEVELOPMENT, bump, releaseAs });
  }

  if (branch === QA_BRANCH) {
    if (currentChannel === CHANNEL_DEVELOPMENT) {
      return `${coreVersion(current)}-${CHANNEL_QA}.1`;
    }

    return nextPrerelease({ current, channel: CHANNEL_QA, bump, releaseAs });
  }

  if (isNamedReleaseBranch(branch)) {
    const channel = namedReleaseChannel(branch);

    if (currentChannel === CHANNEL_QA || currentChannel === CHANNEL_DEVELOPMENT) {
      return `${coreVersion(current)}-${channel}.1`;
    }

    return nextPrerelease({ current, channel, bump, releaseAs });
  }

  if (isProductionBranch(branch)) {
    const releaseChannel = currentChannel;

    if (!releaseChannel || releaseChannel === 'production' || releaseChannel === CHANNEL_QA) {
      throw new Error(
        `Production releases must start from a release:<slug> prerelease (got ${current}). Cherry-pick qa onto a release branch first.`,
      );
    }

    return coreVersion(current);
  }

  throw new Error(
    `Releases are only allowed on ${DEVELOPMENT_BRANCH}, ${QA_BRANCH}, release:<slug>, or ${PRODUCTION_BRANCHES.join('/')}.`,
  );
}

export function versionAllowedOnRemote(version, remoteBranch) {
  const channel = channelOf(version);

  if (remoteBranch === DEVELOPMENT_BRANCH) {
    return channel === 'production' || channel === CHANNEL_DEVELOPMENT;
  }

  if (remoteBranch === QA_BRANCH || isQaPromoteBranch(remoteBranch)) {
    return channel === 'production' || channel === CHANNEL_DEVELOPMENT || channel === CHANNEL_QA;
  }

  if (isNamedReleaseBranch(remoteBranch)) {
    let slug;

    try {
      slug = namedReleaseChannel(remoteBranch);
    } catch {
      return false;
    }

    return (
      channel === 'production' ||
      channel === CHANNEL_DEVELOPMENT ||
      channel === CHANNEL_QA ||
      channel === slug
    );
  }

  if (isProductionBranch(remoteBranch)) {
    return (
      channel === 'production' ||
      (Boolean(channel) && channel !== CHANNEL_QA && channel !== CHANNEL_DEVELOPMENT)
    );
  }

  return true;
}

export function npmDistTag(version) {
  const channel = channelOf(version);

  if (channel === 'production') {
    return 'latest';
  }

  if (channel) {
    return channel;
  }

  throw new Error(`Cannot publish "${version}". Use x.y.z or x.y.z-<channel>.N.`);
}

export function describeVersionRule(remoteBranch) {
  if (remoteBranch === DEVELOPMENT_BRANCH) {
    return 'a stable x.y.z version or an x.y.z-development.N prerelease';
  }

  if (remoteBranch === QA_BRANCH) {
    return 'a stable x.y.z version, an x.y.z-development.N prerelease, or an x.y.z-qa.N prerelease';
  }

  if (isNamedReleaseBranch(remoteBranch)) {
    return 'a stable version, an x.y.z-development.N or x.y.z-qa.N prerelease, or x.y.z-<slug>.N for this release branch';
  }

  if (isProductionBranch(remoteBranch)) {
    return 'an x.y.z-<release-slug>.N prerelease or a stable x.y.z version';
  }

  return 'any semver version';
}
