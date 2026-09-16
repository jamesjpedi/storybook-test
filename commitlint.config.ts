import type { Plugin, UserConfig } from '@commitlint/types';

const STORY_ID = /AB#\d+/u;
const TYPES_REQUIRING_STORY_ID = new Set(['feat', 'fix', 'perf', 'refactor']);

function isReleaseCommit(type: string | null | undefined, scope: string | null | undefined) {
  return type === 'chore' && scope === 'release';
}

const storyIdPlugin: Plugin = {
  rules: {
    'bhhc-story-id': ({ type, scope, raw, header, body, footer }) => {
      if (isReleaseCommit(type, scope)) {
        return [true];
      }

      if (!type || !TYPES_REQUIRING_STORY_ID.has(type)) {
        return [true];
      }

      const text = [raw, header, body, footer].filter(Boolean).join('\n');

      if (STORY_ID.test(text)) {
        return [true];
      }

      return [
        false,
        'feat/fix/perf/refactor commits must include an Azure Boards id (AB#12345) in the subject, body, or footer',
      ];
    },
  },
};

const config = {
  extends: ['@commitlint/config-conventional'],
  plugins: [storyIdPlugin],
  rules: {
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [2, 'always', 100],
    'bhhc-story-id': [2, 'always'],
  },
} as UserConfig;

export default config;
