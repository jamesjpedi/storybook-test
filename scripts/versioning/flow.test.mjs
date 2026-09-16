import assert from 'node:assert/strict';
import test from 'node:test';

import { assertAllowedPush, assertValidReleaseTag, canPushToRemote } from './flow.mjs';

test('enforces development → qa → master promotion', () => {
  assert.equal(canPushToRemote('feature/12345-button', 'development'), true);
  assert.equal(canPushToRemote('development', 'qa'), true);
  assert.equal(canPushToRemote('qa', 'master'), true);
  assert.equal(canPushToRemote('development', 'master'), false);
  assert.equal(canPushToRemote('feature/12345-button', 'qa'), false);
  assert.equal(canPushToRemote('feature/12345-button', 'master'), false);
  assert.equal(canPushToRemote('master', 'development'), true);
});

test('throws a skip-lane error when pushing development to master', () => {
  assert.throws(() => assertAllowedPush('development', 'master'), /development → qa → master/);
});

test('accepts only channel-aware version tags', () => {
  assertValidReleaseTag('v1.0.0');
  assertValidReleaseTag('v1.0.0-development.1');
  assertValidReleaseTag('v1.0.0-qa.8');
  assert.throws(() => assertValidReleaseTag('1.0.0'), /not allowed/);
  assert.throws(() => assertValidReleaseTag('v1.0.0-dev.1'), /not allowed/);
  assert.throws(() => assertValidReleaseTag('v1.0.0-development'), /not allowed/);
});
