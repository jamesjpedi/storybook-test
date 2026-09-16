import { spawnSync } from 'node:child_process';

import { TAG_PATTERN, TAG_PREFIX } from './config.mjs';
import { channelOf, coreVersion } from './version.mjs';

export function git(args, { allowFail = false } = {}) {
  const result = spawnSync('git', args, { encoding: 'utf8' });

  if (result.status !== 0) {
    if (allowFail) {
      return '';
    }

    const detail = result.stderr.trim() || `git ${args.join(' ')} failed`;

    throw new Error(detail);
  }

  return result.stdout.trim();
}

export function currentBranch() {
  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);

  if (branch === 'HEAD') {
    throw new Error('Detached HEAD is not allowed for versioning commands.');
  }

  return branch;
}

export function isWorkingTreeClean() {
  return git(['status', '--porcelain']).length === 0;
}

export function remoteUrl(name = 'origin') {
  return git(['remote', 'get-url', name], { allowFail: true });
}

export function tagExists(tagName) {
  return (
    git(['rev-parse', '--verify', '--quiet', `refs/tags/${tagName}`], { allowFail: true }).length >
    0
  );
}

export function refExists(ref) {
  return spawnSync('git', ['rev-parse', '--verify', '--quiet', ref]).status === 0;
}

export function fileAtRevision(revision, filePath) {
  return git(['show', `${revision}:${filePath}`], { allowFail: true });
}

export function packageVersionAt(revision) {
  const contents = fileAtRevision(revision, 'package.json');

  if (!contents) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(contents);

    return typeof parsed.version === 'string' ? parsed.version : undefined;
  } catch {
    return undefined;
  }
}

export function listReleaseTags() {
  const tags = git(['tag', '--list', 'v*', '--sort=-v:refname'], { allowFail: true });

  if (!tags) {
    return [];
  }

  return tags.split('\n').filter((tag) => TAG_PATTERN.test(tag));
}

export function lastReleaseTag({ channel, core } = {}) {
  return listReleaseTags().find((tag) => {
    const version = tag.slice(TAG_PREFIX.length);
    const tagChannel = channelOf(version);

    if (channel && tagChannel !== channel) {
      return false;
    }

    if (core && coreVersion(version) !== core) {
      return false;
    }

    return true;
  });
}

function parseLogBlock(block) {
  const [hash, author, subject, ...bodyParts] = block.split('\n');

  if (!hash || !author || subject === undefined) {
    return undefined;
  }

  return {
    hash,
    author,
    subject,
    body: bodyParts.join('\n').trim(),
  };
}

export function commitsSince(fromRef) {
  const resolvedFrom = fromRef && refExists(fromRef) ? fromRef : undefined;
  const range = resolvedFrom ? `${resolvedFrom}..HEAD` : 'HEAD';

  const output = git(['log', range, '--no-merges', '--format=%H%n%an%n%s%n%b%x1e'], {
    allowFail: true,
  });

  if (!output) {
    return [];
  }

  return output
    .split('\x1e')
    .map((block) => parseLogBlock(block.trim()))
    .filter((commit) => Boolean(commit));
}

export function createAnnotatedTag(tagName, message) {
  git(['tag', '-a', tagName, '-m', message]);
}

export function commitAll(paths, message) {
  git(['add', '--', ...paths]);
  git(['commit', '-m', message]);
}

export function pushRelease({ followTags }) {
  const args = ['push'];

  if (followTags) {
    args.push('--follow-tags');
  }

  git(args);
}
