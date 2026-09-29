export const DEVELOPMENT_BRANCH = 'development';
export const QA_BRANCH = 'qa';
export const PRODUCTION_BRANCHES = ['master', 'main'];

export const CHANNEL_DEVELOPMENT = 'development';
export const CHANNEL_QA = 'qa';

export const TAG_PREFIX = 'v';

export const RELEASE_COMMIT_TYPE = 'chore';
export const RELEASE_COMMIT_SCOPE = 'release';

export const CHANGELOG_PATH = 'CHANGELOG.md';
export const STORYBOOK_VERSIONS_DIR = 'src/docs/changelog/versions';
export const PACKAGE_JSON_PATH = 'package.json';

export const CHANGELOG_HEADER = `# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
Work lands on \`development\` as \`x.y.z-development.N\`. Promote by cherry-pick: \`qa/*\` → \`qa\`,
then \`release:*\` → \`master\`.

`;

export const RELEASABLE_TYPES = ['feat', 'fix', 'perf', 'refactor'];

export const TYPES_REQUIRING_STORY_ID = ['feat', 'fix', 'perf', 'refactor'];

export const TYPE_TO_CHANGELOG_SECTION = {
  feat: 'Added',
  fix: 'Fixed',
  perf: 'Changed',
  refactor: 'Changed',
  revert: 'Changed',
};

export const CHANGELOG_SECTION_ORDER = [
  'Breaking changes',
  'Added',
  'Changed',
  'Deprecated',
  'Removed',
  'Fixed',
  'Security',
];

export const STORY_ID_PATTERN = /AB#(\d+)/gu;

export const TAG_PATTERN = /^v\d+\.\d+\.\d+(?:-[a-zA-Z][a-zA-Z0-9-]*\.\d+)?$/u;

export const WORKING_BRANCH_PATTERN =
  /^(?:feature|bugfix|hotfix|chore|docs|test|refactor|fix|perf|ci|style|build)\/.+/u;

export const QA_PROMOTE_BRANCH_PATTERN = /^(?:qa[:/])(.+)$/u;

export const NAMED_RELEASE_BRANCH_PATTERN = /^(?:release[:/])(.+)$/u;

export const PROMOTION_HINT =
  'Version development with npm run release. Create qa/<slug> from qa and cherry-pick development (merge only to qa). Create release:<slug> from master and cherry-pick qa (merge only to master).';

export function isQaPromoteBranch(branch) {
  return QA_PROMOTE_BRANCH_PATTERN.test(branch);
}

export function isNamedReleaseBranch(branch) {
  return NAMED_RELEASE_BRANCH_PATTERN.test(branch);
}

export function namedReleaseSlug(branch) {
  const match = NAMED_RELEASE_BRANCH_PATTERN.exec(branch);

  return match?.[1];
}
