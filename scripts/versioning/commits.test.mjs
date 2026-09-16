import assert from 'node:assert/strict';
import test from 'node:test';

import { inferBump, parseCommit } from './commits.mjs';

test('parses conventional commits, story ids, and breaking changes', () => {
  const commit = parseCommit({
    hash: 'abc',
    author: 'Jane Doe',
    subject: 'feat(button)!: replace variant API',
    body: 'AB#12345\n\nBREAKING CHANGE: variant names changed.',
  });

  assert.equal(commit.type, 'feat');
  assert.equal(commit.scope, 'button');
  assert.equal(commit.breaking, true);
  assert.deepEqual(commit.storyIds, ['12345']);
  assert.equal(commit.section, 'Added');
  assert.equal(commit.releasable, true);
});

test('collects unique story ids from the subject and body', () => {
  const commit = parseCommit({
    hash: 'abc',
    author: 'Jane Doe',
    subject: 'fix: restore focus trap AB#100 AB#100',
    body: 'Also tracked as AB#200.',
  });

  assert.deepEqual(commit.storyIds, ['100', '200']);
});

test('infers bump from conventional commit types', () => {
  assert.equal(
    inferBump([parseCommit({ hash: 'a', author: 'A', subject: 'fix: padding', body: 'AB#1' })]),
    'patch',
  );
  assert.equal(
    inferBump([parseCommit({ hash: 'a', author: 'A', subject: 'feat: add card', body: 'AB#1' })]),
    'minor',
  );
  assert.equal(
    inferBump([
      parseCommit({
        hash: 'a',
        author: 'A',
        subject: 'feat!: remove legacy prop',
        body: 'AB#1',
      }),
    ]),
    'major',
  );
  assert.equal(inferBump([]), undefined);
});
