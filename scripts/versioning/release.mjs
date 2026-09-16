import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveAzureDevOpsContext } from './azure-boards.mjs';
import {
  renderChangelogSection,
  renderVersionNotes,
  storybookVersionPath,
  upsertRootChangelog,
  writeRootChangelog,
  writeStorybookVersion,
} from './changelog.mjs';
import { inferBump, parseCommit } from './commits.mjs';
import {
  CHANGELOG_PATH,
  CHANNEL_DEVELOPMENT,
  CHANNEL_QA,
  DEVELOPMENT_BRANCH,
  PACKAGE_JSON_PATH,
  QA_BRANCH,
  RELEASE_COMMIT_SCOPE,
  RELEASE_COMMIT_TYPE,
  TAG_PREFIX,
} from './config.mjs';
import {
  commitAll,
  commitsSince,
  createAnnotatedTag,
  currentBranch,
  git,
  isWorkingTreeClean,
  lastReleaseTag,
  pushRelease,
  remoteUrl,
  tagExists,
} from './git.mjs';
import {
  channelOf,
  coreVersion,
  isProductionBranch,
  isReleaseBranch,
  nextVersion,
} from './version.mjs';

function fail(message) {
  console.error(message);
  process.exit(1);
}

function parseArgs(argv) {
  const options = {
    dryRun: false,
    push: false,
    releaseAs: undefined,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (arg === '--push') {
      options.push = true;
      continue;
    }

    if (arg === '--release-as') {
      const value = argv[index + 1];

      if (!value || value.startsWith('--')) {
        throw new Error('--release-as requires a stable version, for example 1.0.0.');
      }

      options.releaseAs = value;
      index += 1;
      continue;
    }

    if (arg.startsWith('--release-as=')) {
      options.releaseAs = arg.slice('--release-as='.length);
      continue;
    }

    throw new Error(`Unknown argument "${arg}".`);
  }

  return options;
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

function writePackageVersion(rootDir, version) {
  const filePath = path.join(rootDir, PACKAGE_JSON_PATH);
  const source = readFileSync(filePath, 'utf8');

  if (!/"version"\s*:\s*"[^"]+"/u.test(source)) {
    throw new Error('Could not find a version field in package.json.');
  }

  writeFileSync(filePath, source.replace(/("version"\s*:\s*")([^"]+)(")/u, `$1${version}$3`));
}

function changelogFromRef(branch, current) {
  const currentChannel = channelOf(current);
  const core = coreVersion(current);

  if (isProductionBranch(branch)) {
    return lastReleaseTag({ channel: 'production' });
  }

  if (branch === QA_BRANCH) {
    if (currentChannel === CHANNEL_QA) {
      return lastReleaseTag({ channel: CHANNEL_QA, core });
    }

    return lastReleaseTag({ channel: 'production' });
  }

  if (currentChannel === CHANNEL_DEVELOPMENT) {
    return lastReleaseTag({ channel: CHANNEL_DEVELOPMENT, core });
  }

  return lastReleaseTag({ channel: 'production' });
}

function needsCoreBump(branch, current) {
  return branch === DEVELOPMENT_BRANCH && channelOf(current) !== CHANNEL_DEVELOPMENT;
}

function main() {
  let options;

  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }

  const branch = currentBranch();

  if (!isReleaseBranch(branch)) {
    fail(
      `npm run release must be run on ${DEVELOPMENT_BRANCH}, ${QA_BRANCH}, or master (current: ${branch}).`,
    );
  }

  if (!options.dryRun && !isWorkingTreeClean()) {
    fail('Working tree is not clean. Commit or stash changes before releasing.');
  }

  git(['fetch', '--tags', '--quiet', 'origin'], { allowFail: true });

  const rootDir = repoRoot();
  const current = readPackageVersion(rootDir);
  const fromRef = changelogFromRef(branch, current);
  const commits = commitsSince(fromRef).map((entry) => parseCommit(entry));
  const releasable = commits.filter((commit) => commit.releasable);
  const bump = inferBump(releasable);

  if (needsCoreBump(branch, current) && !options.releaseAs && !bump) {
    fail(
      `No feat/fix/perf/refactor commits since ${fromRef ?? 'the start of the repository'}. Pass --release-as 1.0.0 to start a version explicitly.`,
    );
  }

  let version;

  try {
    version = nextVersion({
      current,
      branch,
      bump,
      releaseAs: options.releaseAs,
    });
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }

  const tagName = `${TAG_PREFIX}${version}`;

  if (tagExists(tagName)) {
    fail(`Tag ${tagName} already exists.`);
  }

  const azureContext = resolveAzureDevOpsContext(remoteUrl());
  const notes = renderVersionNotes(version, releasable, azureContext);
  const changelogSection = renderChangelogSection(version, releasable, azureContext);

  const nextChangelog = upsertRootChangelog(rootDir, changelogSection);

  const releaseMessage = `${RELEASE_COMMIT_TYPE}(${RELEASE_COMMIT_SCOPE}): ${version}`;

  console.error(`Branch:    ${branch}`);
  console.error(`Current:   ${current}`);
  console.error(`Next:      ${version}`);
  console.error(`Tag:       ${tagName}`);
  console.error(`From:      ${fromRef ?? '(start of history)'}`);
  console.error(`Commits:   ${String(releasable.length)}`);

  if (!azureContext) {
    console.error(
      'Warning: Azure DevOps org/project could not be inferred. Story IDs will not be linked. Set AZURE_DEVOPS_ORG and AZURE_DEVOPS_PROJECT, or use an Azure DevOps origin remote.',
    );
  }

  console.error('\nChangelog preview:\n');
  console.error(notes);

  if (options.dryRun) {
    console.error('Dry run complete. No files, commits, or tags were written.');

    return;
  }

  writePackageVersion(rootDir, version);
  writeRootChangelog(rootDir, nextChangelog);
  writeStorybookVersion(rootDir, version, notes);

  const paths = [PACKAGE_JSON_PATH, CHANGELOG_PATH, storybookVersionPath(version)];

  commitAll(paths, releaseMessage);
  createAnnotatedTag(tagName, version);

  if (options.push) {
    pushRelease({ followTags: true });
    console.error(`Released ${version} and pushed ${tagName}.`);

    return;
  }

  console.error(`Released ${version} locally as ${tagName}.`);
  console.error('Push with: git push --follow-tags');
}

const invokedDirectly =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);

if (invokedDirectly) {
  try {
    main();
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  }
}
