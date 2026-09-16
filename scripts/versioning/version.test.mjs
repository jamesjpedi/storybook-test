import assert from 'node:assert/strict';
import test from 'node:test';

import { nextVersion, versionAllowedOnRemote } from './version.mjs';

test('increments development prereleases without changing the core version', () => {
  assert.equal(
    nextVersion({ current: '1.0.0-development.1', branch: 'development' }),
    '1.0.0-development.2',
  );
});

test('starts a development cycle from a stable version', () => {
  assert.equal(
    nextVersion({ current: '1.0.0', branch: 'development', bump: 'minor' }),
    '1.1.0-development.1',
  );
});

test('uses --release-as for the first public development version', () => {
  assert.equal(
    nextVersion({ current: '0.0.0', branch: 'development', releaseAs: '1.0.0' }),
    '1.0.0-development.1',
  );
});

test('promotes development to qa, then production', () => {
  assert.equal(nextVersion({ current: '1.0.0-development.4', branch: 'qa' }), '1.0.0-qa.1');
  assert.equal(nextVersion({ current: '1.0.0-qa.1', branch: 'qa' }), '1.0.0-qa.2');
  assert.equal(nextVersion({ current: '1.0.0-qa.2', branch: 'master' }), '1.0.0');
  assert.equal(nextVersion({ current: '1.0.0-qa.2', branch: 'main' }), '1.0.0');
});

test('rejects skip-lane promotions', () => {
  assert.throws(
    () => nextVersion({ current: '1.0.0-development.1', branch: 'master' }),
    /qa prerelease/,
  );
  assert.throws(() => nextVersion({ current: '1.0.0', branch: 'qa' }), /development prerelease/);
  assert.throws(
    () => nextVersion({ current: '1.0.0-qa.1', branch: 'development' }),
    /Cannot cut a development release from QA/,
  );
  assert.throws(
    () => nextVersion({ current: '1.0.0', branch: 'feature/12345-button', bump: 'minor' }),
    /only allowed/,
  );
});

test('allows pending promotion versions on each remote', () => {
  assert.equal(versionAllowedOnRemote('1.0.0-development.2', 'development'), true);
  assert.equal(versionAllowedOnRemote('1.0.0', 'development'), true);
  assert.equal(versionAllowedOnRemote('1.0.0-qa.1', 'development'), false);
  assert.equal(versionAllowedOnRemote('1.0.0-development.2', 'qa'), true);
  assert.equal(versionAllowedOnRemote('1.0.0', 'qa'), false);
  assert.equal(versionAllowedOnRemote('1.0.0-qa.1', 'master'), true);
  assert.equal(versionAllowedOnRemote('1.0.0-development.1', 'master'), false);
});
