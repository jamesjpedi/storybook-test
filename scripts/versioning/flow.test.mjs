import assert from 'node:assert/strict';
import test from 'node:test';

import { assertAllowedPush, assertValidReleaseTag, canPushToRemote } from './flow.mjs';

test('enforces cherry-pick promotion, not direct development → qa → master', () => {
  assert.equal(canPushToRemote('feature/12345-button', 'development'), true);
  assert.equal(canPushToRemote('qa/sprint-12', 'qa'), true);
  assert.equal(canPushToRemote('qa:fix-focus', 'qa'), true);
  assert.equal(canPushToRemote('release:sprint-12', 'master'), true);
  assert.equal(canPushToRemote('release/some-test', 'main'), true);
  assert.equal(canPushToRemote('development', 'qa'), false);
  assert.equal(canPushToRemote('qa', 'master'), false);
  assert.equal(canPushToRemote('development', 'master'), false);
  assert.equal(canPushToRemote('feature/12345-button', 'qa'), false);
  assert.equal(canPushToRemote('feature/12345-button', 'master'), false);
  assert.equal(canPushToRemote('qa/sprint-12', 'master'), false);
  assert.equal(canPushToRemote('qa/sprint-12', 'development'), false);
  assert.equal(canPushToRemote('release:sprint-12', 'qa'), false);
  assert.equal(canPushToRemote('release:sprint-12', 'development'), false);
  assert.equal(canPushToRemote('master', 'development'), true);
});

test('throws when a cherry-pick branch is merged to the wrong target', () => {
  assert.throws(() => assertAllowedPush('qa/sprint-12', 'master'), /merge only to master/);
  assert.throws(() => assertAllowedPush('development', 'qa'), /qa\/<slug>/);
});

test('accepts stable, qa, and named-release tags', () => {
  assertValidReleaseTag('v1.0.0');
  assertValidReleaseTag('v1.0.0-qa.8');
  assertValidReleaseTag('v1.0.0-sprint-12.1');
  assertValidReleaseTag('v1.0.0-development.1');
  assert.throws(() => assertValidReleaseTag('1.0.0'), /not allowed/);
  assert.throws(() => assertValidReleaseTag('v1.0.0-qa'), /not allowed/);
});
