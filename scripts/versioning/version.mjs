import semver from 'semver';

import {
  CHANNEL_DEVELOPMENT,
  CHANNEL_QA,
  DEVELOPMENT_BRANCH,
  PRODUCTION_BRANCHES,
  QA_BRANCH,
} from './config.mjs';

export function isProductionBranch(branch) {
  return PRODUCTION_BRANCHES.includes(branch);
}

export function isReleaseBranch(branch) {
  return branch === DEVELOPMENT_BRANCH || branch === QA_BRANCH || isProductionBranch(branch);
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
    (identifier === CHANNEL_DEVELOPMENT || identifier === CHANNEL_QA) &&
    typeof number === 'number'
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

export function nextVersion({ current, branch, bump, releaseAs }) {
  if (!semver.valid(current)) {
    throw new Error(`package.json version "${current}" is not valid semver.`);
  }

  if (releaseAs) {
    const parsedReleaseAs = semver.parse(releaseAs);

    if (!parsedReleaseAs || parsedReleaseAs.prerelease.length > 0) {
      throw new Error(`--release-as must be a stable x.y.z version (got "${releaseAs}").`);
    }

    if (branch !== DEVELOPMENT_BRANCH) {
      throw new Error('--release-as is only used when cutting a new development cycle.');
    }
  }

  const currentChannel = channelOf(current);

  if (semver.parse(current)?.prerelease.length && !currentChannel) {
    throw new Error(
      `Unsupported prerelease in "${current}". Use x.y.z-development.N or x.y.z-qa.N.`,
    );
  }

  if (branch === DEVELOPMENT_BRANCH) {
    if (currentChannel === CHANNEL_QA) {
      throw new Error(
        `Cannot cut a development release from QA version ${current}. Sync from master after production, or keep incrementing on development before promoting.`,
      );
    }

    if (currentChannel === CHANNEL_DEVELOPMENT) {
      if (releaseAs && coreVersion(current) !== coreVersion(releaseAs) && coreVersion(releaseAs)) {
        const nextCore = coreVersion(releaseAs);

        return `${nextCore}-${CHANNEL_DEVELOPMENT}.1`;
      }

      return incrementPrerelease(current, CHANNEL_DEVELOPMENT);
    }

    const nextCore = coreVersion(releaseAs) ?? bumpCore(current, bump ?? 'patch');

    return `${nextCore}-${CHANNEL_DEVELOPMENT}.1`;
  }

  if (branch === QA_BRANCH) {
    if (currentChannel === CHANNEL_QA) {
      return incrementPrerelease(current, CHANNEL_QA);
    }

    if (currentChannel !== CHANNEL_DEVELOPMENT) {
      throw new Error(
        `QA releases must start from a development prerelease (got ${current}). Promote development → qa.`,
      );
    }

    return `${coreVersion(current)}-${CHANNEL_QA}.1`;
  }

  if (isProductionBranch(branch)) {
    if (currentChannel !== CHANNEL_QA) {
      throw new Error(
        `Production releases must start from a qa prerelease (got ${current}). Promote qa → master.`,
      );
    }

    return coreVersion(current);
  }

  throw new Error(
    `Releases are only allowed on ${DEVELOPMENT_BRANCH}, ${QA_BRANCH}, or ${PRODUCTION_BRANCHES.join('/')}.`,
  );
}

export function versionAllowedOnRemote(version, remoteBranch) {
  const channel = channelOf(version);

  if (remoteBranch === DEVELOPMENT_BRANCH) {
    return channel === 'production' || channel === CHANNEL_DEVELOPMENT;
  }

  if (remoteBranch === QA_BRANCH) {
    return channel === CHANNEL_DEVELOPMENT || channel === CHANNEL_QA;
  }

  if (isProductionBranch(remoteBranch)) {
    return channel === CHANNEL_QA || channel === 'production';
  }

  return true;
}

export function npmDistTag(version) {
  const channel = channelOf(version);

  if (channel === CHANNEL_DEVELOPMENT) {
    return CHANNEL_DEVELOPMENT;
  }

  if (channel === CHANNEL_QA) {
    return CHANNEL_QA;
  }

  if (channel === 'production') {
    return 'latest';
  }

  throw new Error(`Cannot publish "${version}". Use x.y.z, x.y.z-development.N, or x.y.z-qa.N.`);
}

export function describeVersionRule(remoteBranch) {
  if (remoteBranch === DEVELOPMENT_BRANCH) {
    return '0.0.0, a stable production version, or an x.y.z-development.N prerelease';
  }

  if (remoteBranch === QA_BRANCH) {
    return 'an x.y.z-development.N or x.y.z-qa.N prerelease';
  }

  if (isProductionBranch(remoteBranch)) {
    return 'an x.y.z-qa.N prerelease or a stable x.y.z version';
  }

  return 'any semver version';
}
