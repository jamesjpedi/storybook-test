import { RELEASABLE_TYPES, STORY_ID_PATTERN, TYPE_TO_CHANGELOG_SECTION } from './config.mjs';

const HEADER_PATTERN = /^(?<type>[a-z]+)(?:\((?<scope>[^)]+)\))?(?<breaking>!)?: (?<subject>.+)$/u;

export function extractStoryIds(text) {
  const ids = [];
  const seen = new Set();

  for (const match of text.matchAll(STORY_ID_PATTERN)) {
    const id = match[1];

    if (!id || seen.has(id)) {
      continue;
    }

    seen.add(id);
    ids.push(id);
  }

  return ids;
}

export function parseCommit({ hash, author, subject, body }) {
  const headerMatch = HEADER_PATTERN.exec(subject.trim());
  const raw = [subject, body].filter(Boolean).join('\n\n');
  const breakingInBody = /^BREAKING[ -]CHANGE:/mu.test(body);
  const type = headerMatch?.groups?.type;
  const scope = headerMatch?.groups?.scope;
  const breaking = Boolean(headerMatch?.groups?.breaking) || breakingInBody;

  return {
    hash,
    author: author.trim(),
    subject: headerMatch?.groups?.subject?.trim() ?? subject.trim(),
    type,
    scope,
    breaking,
    storyIds: extractStoryIds(raw),
    releasable: Boolean(type && (breaking || RELEASABLE_TYPES.includes(type))),
    section: type ? (TYPE_TO_CHANGELOG_SECTION[type] ?? undefined) : undefined,
  };
}

export function inferBump(commits) {
  if (commits.some((commit) => commit.breaking)) {
    return 'major';
  }

  if (commits.some((commit) => commit.type === 'feat')) {
    return 'minor';
  }

  if (commits.some((commit) => commit.type === 'fix' || commit.type === 'perf')) {
    return 'patch';
  }

  if (commits.some((commit) => commit.releasable)) {
    return 'patch';
  }

  return undefined;
}

export function uniqueAuthors(commits) {
  return [...new Set(commits.map((commit) => commit.author).filter(Boolean))];
}
