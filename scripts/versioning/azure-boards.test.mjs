import assert from 'node:assert/strict';
import test from 'node:test';

import { formatStoryMarkdown, parseAzureDevOpsRemote } from './azure-boards.mjs';

test('parses Azure DevOps HTTPS, SSH, and visualstudio remotes', () => {
  assert.deepEqual(
    parseAzureDevOpsRemote('https://dev.azure.com/BHHC/DesignSystem/_git/storybook'),
    { organization: 'BHHC', project: 'DesignSystem', repository: 'storybook' },
  );
  assert.deepEqual(parseAzureDevOpsRemote('git@ssh.dev.azure.com:v3/BHHC/DesignSystem/storybook'), {
    organization: 'BHHC',
    project: 'DesignSystem',
    repository: 'storybook',
  });
  assert.deepEqual(
    parseAzureDevOpsRemote('https://bhhc.visualstudio.com/DesignSystem/_git/storybook'),
    { organization: 'bhhc', project: 'DesignSystem', repository: 'storybook' },
  );
});

test('builds Azure Boards markdown links', () => {
  assert.equal(
    formatStoryMarkdown('12345', {
      organization: 'BHHC',
      project: 'DesignSystem',
      repository: 'storybook',
    }),
    '[AB#12345](https://dev.azure.com/BHHC/DesignSystem/_workitems/edit/12345)',
  );
  assert.equal(formatStoryMarkdown('12345'), 'AB#12345');
});
