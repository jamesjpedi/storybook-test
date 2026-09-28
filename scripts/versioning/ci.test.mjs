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
    () =>
      assertCiContext(
        { kind: 'pull-request', source: 'development', target: 'master' },
        '1.0.0-development.1',
      ),
    /development → qa → master/,
  );
  assert.throws(
    () =>
      assertCiContext(
        { kind: 'pull-request', source: 'feature/12345-button', target: 'qa' },
        '1.0.0-development.1',
      ),
    /qa only accepts/,
  );
  assert.throws(
    () => assertCiContext({ kind: 'tag', tagName: 'v1.0.0' }, '1.0.0-qa.1'),
    /does not match/,
  );
  assert.equal(assertCiContext({ kind: 'tag', tagName: 'v1.0.0' }, '1.0.0'), 'tag v1.0.0 (1.0.0)');
  assert.equal(
    assertCiContext({ kind: 'branch', branch: 'development' }, '0.0.0'),
    'branch development (0.0.0)',
  );
});

test('maps package channels to npm dist-tags', () => {
  assert.equal(npmDistTag('1.0.0-development.1'), 'development');
  assert.equal(npmDistTag('1.0.0-qa.2'), 'qa');
  assert.equal(npmDistTag('1.0.0'), 'latest');
  assert.throws(() => npmDistTag('1.0.0-rc.1'), /Cannot publish/);
});

test('requires the git tag to match package.json', () => {
  assertTagMatchesVersion('v1.0.0-development.1', '1.0.0-development.1');
  assert.throws(
    () => assertTagMatchesVersion('v1.0.0-development.2', '1.0.0-development.1'),
    /does not match/,
  );
});
