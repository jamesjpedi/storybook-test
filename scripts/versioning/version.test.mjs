import assert from 'node:assert/strict';
import test from 'node:test';

import { namedReleaseChannel, nextVersion, versionAllowedOnRemote } from './version.mjs';

test('does not cut versions on development', () => {
  assert.throws(
    () => nextVersion({ current: '0.0.0', branch: 'development', bump: 'minor' }),
    /Do not cut versions on development/,
  );
});

test('starts and increments qa prereleases without a development version', () => {
  assert.equal(nextVersion({ current: '0.0.0', branch: 'qa', releaseAs: '1.0.0' }), '1.0.0-qa.1');
  assert.equal(nextVersion({ current: '1.0.0', branch: 'qa', bump: 'minor' }), '1.1.0-qa.1');
  assert.equal(nextVersion({ current: '1.0.0-qa.1', branch: 'qa' }), '1.0.0-qa.2');
});

test('release branches use the same prerelease rules as qa', () => {
  assert.equal(namedReleaseChannel('release:sprint-12'), 'sprint-12');
  assert.equal(namedReleaseChannel('release/some-test-or-version'), 'some-test-or-version');
  assert.equal(
    nextVersion({ current: '1.0.0-qa.4', branch: 'release:sprint-12' }),
    '1.0.0-sprint-12.1',
  );
  assert.equal(
    nextVersion({ current: '1.0.0-sprint-12.1', branch: 'release:sprint-12' }),
    '1.0.0-sprint-12.2',
  );
  assert.equal(
    nextVersion({ current: '1.0.0', branch: 'release:sprint-12', bump: 'patch' }),
    '1.0.1-sprint-12.1',
  );
});

test('production strips a named release prerelease, not qa', () => {
  assert.equal(nextVersion({ current: '1.0.0-sprint-12.2', branch: 'master' }), '1.0.0');
  assert.equal(nextVersion({ current: '1.0.0-sprint-12.2', branch: 'main' }), '1.0.0');
  assert.throws(
    () => nextVersion({ current: '1.0.0-qa.2', branch: 'master' }),
    /release:<slug> prerelease/,
  );
});

test('rejects releases on feature branches', () => {
  assert.throws(
    () => nextVersion({ current: '1.0.0', branch: 'feature/12345-button', bump: 'minor' }),
    /only allowed/,
  );
});

test('allows pending versions on each remote', () => {
  assert.equal(versionAllowedOnRemote('0.0.0', 'development'), true);
  assert.equal(versionAllowedOnRemote('1.0.0-qa.1', 'development'), true);
  assert.equal(versionAllowedOnRemote('1.0.0', 'qa'), true);
  assert.equal(versionAllowedOnRemote('1.0.0-qa.1', 'qa'), true);
  assert.equal(versionAllowedOnRemote('1.0.0-sprint-12.1', 'qa'), false);
  assert.equal(versionAllowedOnRemote('1.0.0-qa.1', 'release:sprint-12'), true);
  assert.equal(versionAllowedOnRemote('1.0.0-sprint-12.1', 'release:sprint-12'), true);
  assert.equal(versionAllowedOnRemote('1.0.0-qa.1', 'master'), false);
  assert.equal(versionAllowedOnRemote('1.0.0-sprint-12.1', 'master'), true);
  assert.equal(versionAllowedOnRemote('1.0.0', 'master'), true);
});
