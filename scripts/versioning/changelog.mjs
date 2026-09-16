import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { formatStoryMarkdown } from './azure-boards.mjs';
import { uniqueAuthors } from './commits.mjs';
import {
  CHANGELOG_HEADER,
  CHANGELOG_PATH,
  CHANGELOG_SECTION_ORDER,
  STORYBOOK_VERSIONS_DIR,
} from './config.mjs';

function todayIso(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function storyLinks(storyIds, azureContext) {
  if (storyIds.length === 0) {
    return '';
  }

  const links = storyIds.map((id) => formatStoryMarkdown(id, azureContext)).join(', ');

  return ` (${links})`;
}

function formatEntry(commit, azureContext) {
  return `- ${commit.subject}${storyLinks(commit.storyIds, azureContext)} — ${commit.author}`;
}

function sectionHeading(title, isKeepAChangelog) {
  return isKeepAChangelog ? `### ${title}` : `## ${title}`;
}

export function buildChangelogBody(commits, azureContext, { keepAChangelog = false } = {}) {
  const sections = new Map();

  for (const commit of commits) {
    if (commit.breaking) {
      const items = sections.get('Breaking changes') ?? [];

      items.push(formatEntry(commit, azureContext));
      sections.set('Breaking changes', items);
    }

    const section = commit.section;

    if (!section) {
      continue;
    }

    const items = sections.get(section) ?? [];

    items.push(formatEntry(commit, azureContext));
    sections.set(section, items);
  }

  const parts = [];

  for (const title of CHANGELOG_SECTION_ORDER) {
    const items = sections.get(title);

    if (!items || items.length === 0) {
      continue;
    }

    parts.push(`${sectionHeading(title, keepAChangelog)}\n\n${items.join('\n')}`);
  }

  const authors = uniqueAuthors(commits);

  if (authors.length > 0) {
    parts.push(
      `${sectionHeading('Contributors', keepAChangelog)}\n\n${authors.map((name) => `- ${name}`).join('\n')}`,
    );
  }

  if (parts.length === 0) {
    parts.push(
      `${sectionHeading('Changed', keepAChangelog)}\n\n- Maintenance release with no user-facing commits.`,
    );
  }

  return parts.join('\n\n');
}

export function renderVersionNotes(version, commits, azureContext) {
  const date = todayIso();
  const body = buildChangelogBody(commits, azureContext, { keepAChangelog: false });

  return `# ${version}\n\n${date}\n\n${body}\n`;
}

export function renderChangelogSection(version, commits, azureContext) {
  const date = todayIso();
  const body = buildChangelogBody(commits, azureContext, { keepAChangelog: true });

  return `## [${version}] - ${date}\n\n${body}\n`;
}

export function upsertRootChangelog(rootDir, section) {
  const filePath = path.join(rootDir, CHANGELOG_PATH);
  let existing;

  try {
    existing = readFileSync(filePath, 'utf8');
  } catch {
    existing = CHANGELOG_HEADER;
  }

  if (!existing.startsWith('# Changelog')) {
    existing = `${CHANGELOG_HEADER}${existing}`;
  }

  const headingIndex = existing.indexOf('\n## ');

  if (headingIndex === -1) {
    const prefix = existing.trimEnd();

    return `${prefix}\n\n${section}`;
  }

  const header = existing.slice(0, headingIndex).trimEnd();
  const rest = existing.slice(headingIndex + 1);

  return `${header}\n\n${section}\n${rest}`;
}

export function writeRootChangelog(rootDir, contents) {
  writeFileSync(
    path.join(rootDir, CHANGELOG_PATH),
    contents.endsWith('\n') ? contents : `${contents}\n`,
  );
}

export function writeStorybookVersion(rootDir, version, notes) {
  const directory = path.join(rootDir, STORYBOOK_VERSIONS_DIR);

  mkdirSync(directory, { recursive: true });
  writeFileSync(path.join(directory, `${version}.md`), notes.endsWith('\n') ? notes : `${notes}\n`);
}

export function storybookVersionPath(version) {
  return `${STORYBOOK_VERSIONS_DIR}/${version}.md`;
}
