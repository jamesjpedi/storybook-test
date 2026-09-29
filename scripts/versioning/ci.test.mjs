import assert from 'node:assert/strict';
import test from 'node:test';

import { assertCiContext, resolveCiContext } from './check-flow.mjs';
import { assertTagMatchesVersion } from './flow.mjs';
import { npmDistTag } from './version.mjs';

test('resolves Azure DevOps pull request, branch, and tag contexts', () => {
  assert.deepEqual(
    resolveCiContext({
      SYSTEM_PULLREQUEST_SOURCEBRANCH: 'refs/heads/feature/12345-button',
      SYSTEM_PULLREQUEST_TARGETBRANCH: 'refs/heads/development',
      BUILD_SOURCEBRANCH: 'refs/pull/8/merge',
    }),
    { kind: 'pull-request', source: 'feature/12345-button', target: 'development' },
  );
  assert.deepEqual(
    resolveCiContext({
      SYSTEM_PULLREQUEST_SOURCEBRANCH: 'refs/heads/qa/sprint-12',
      SYSTEM_PULLREQUEST_TARGETBRANCH: 'refs/heads/qa',
    }),
    { kind: 'pull-request', source: 'qa/sprint-12', target: 'qa' },
  );
  assert.deepEqual(resolveCiContext({ BUILD_SOURCEBRANCH: 'refs/heads/qa' }), {
    kind: 'branch',
    branch: 'qa',
  });
  assert.deepEqual(resolveCiContext({ BUILD_SOURCEBRANCH: 'refs/tags/v1.0.0-qa.1' }), {
    kind: 'tag',
    tagName: 'v1.0.0-qa.1',
  });
  assert.deepEqual(resolveCiContext({}), { kind: 'local' });
});

test('CI rejects skip-lane PRs and mismatched tags', () => {
  assert.throws(
    () => assertCiContext({ kind: 'pull-request', source: 'development', target: 'qa' }, '0.0.0'),
    /qa\/<slug>/,
  );
  assert.throws(
    () => assertCiContext({ kind: 'pull-request', source: 'qa', target: 'master' }, '1.0.0-qa.1'),
    /release\/<slug>/,
  );
  assert.throws(
    () =>
      assertCiContext(
        { kind: 'pull-request', source: 'qa/sprint-12', target: 'master' },
        '1.0.0-qa.1',
      ),
    /merge only to master/,
  );
  assert.throws(
    () => assertCiContext({ kind: 'tag', tagName: 'v1.0.0' }, '1.0.0-qa.1'),
    /does not match/,
  );
  assert.equal(
    assertCiContext({ kind: 'branch', branch: 'development' }, '1.0.0-development.1'),
    'branch development (1.0.0-development.1)',
  );
  assert.equal(
    assertCiContext({ kind: 'pull-request', source: 'qa/sprint-12', target: 'qa' }, '1.0.0-qa.1'),
    'pull request qa/sprint-12 → qa (1.0.0-qa.1)',
  );
  assert.equal(
    assertCiContext(
      { kind: 'pull-request', source: 'release:sprint-12', target: 'master' },
      '1.0.0-sprint-12.1',
    ),
    'pull request release:sprint-12 → master (1.0.0-sprint-12.1)',
  );
  assert.equal(assertCiContext({ kind: 'tag', tagName: 'v1.0.0' }, '1.0.0'), 'tag v1.0.0 (1.0.0)');
  assert.throws(
    () => assertCiContext({ kind: 'branch', branch: 'development' }, '1.0.0-qa.1'),
    /cannot be pushed to development/,
  );
  assert.equal(
    assertCiContext(
      { kind: 'pull-request', source: 'qa/sprint-12', target: 'qa' },
      '1.0.0-development.1',
    ),
    'pull request qa/sprint-12 → qa (1.0.0-development.1)',
  );
});

test('maps package channels to npm dist-tags', () => {
  assert.equal(npmDistTag('1.0.0-qa.2'), 'qa');
  assert.equal(npmDistTag('1.0.0-sprint-12.1'), 'sprint-12');
  assert.equal(npmDistTag('1.0.0'), 'latest');
  assert.equal(npmDistTag('1.0.0-development.1'), 'development');
  assert.throws(() => npmDistTag('1.0.0-rc'), /Cannot publish/);
});

test('requires the git tag to match package.json', () => {
  assertTagMatchesVersion('v1.0.0-sprint-12.1', '1.0.0-sprint-12.1');
  assert.throws(
    () => assertTagMatchesVersion('v1.0.0-sprint-12.2', '1.0.0-sprint-12.1'),
    /does not match/,
  );
});
