import assert from 'node:assert/strict';
import test from 'node:test';

import { buildChangelogBody } from './changelog.mjs';

test('includes story links and contributor names', () => {
  const body = buildChangelogBody(
    [
      {
        subject: 'add outlined Button',
        author: 'Jane Doe',
        type: 'feat',
        breaking: false,
        storyIds: ['12345'],
        section: 'Added',
        releasable: true,
      },
      {
        subject: 'fix Card padding',
        author: 'John Smith',
        type: 'fix',
        breaking: false,
        storyIds: ['12346'],
        section: 'Fixed',
        releasable: true,
      },
    ],
    { organization: 'BHHC', project: 'DesignSystem', repository: 'storybook' },
  );

  assert.match(body, /add outlined Button/);
  assert.match(
    body,
    /\[AB#12345\]\(https:\/\/dev\.azure\.com\/BHHC\/DesignSystem\/_workitems\/edit\/12345\)/,
  );
  assert.match(body, /Jane Doe/);
  assert.match(body, /## Contributors/);
  assert.match(body, /- John Smith/);
});
