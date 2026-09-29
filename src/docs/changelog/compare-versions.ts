/**
 * Compare SemVer 2.0 versions for changelog ordering.
 * Prereleases sort below the matching stable version:
 * 1.0.0-development.N < 1.0.0-qa.N < 1.0.0-<slug>.N < 1.0.0.
 */
function parseIdentifier(part: string): string | number {
  return /^\d+$/u.test(part) ? Number(part) : part;
}

function parseVersion(value: string): { core: number[]; pre: (string | number)[] } | undefined {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/u.exec(value);

  if (!match) {
    return undefined;
  }

  const majorRaw = match[1];
  const minorRaw = match[2];
  const patchRaw = match[3];

  if (!majorRaw || !minorRaw || !patchRaw) {
    return undefined;
  }

  const major = Number(majorRaw);
  const minor = Number(minorRaw);
  const patch = Number(patchRaw);
  const pre = match[4] ? match[4].split('.').map(parseIdentifier) : [];

  return { core: [major, minor, patch], pre };
}

function comparePre(left: (string | number)[], right: (string | number)[]): number {
  if (left.length === 0 && right.length === 0) {
    return 0;
  }

  if (left.length === 0) {
    return 1;
  }

  if (right.length === 0) {
    return -1;
  }

  const max = Math.max(left.length, right.length);

  for (let index = 0; index < max; index += 1) {
    const a = left[index];
    const b = right[index];

    if (a === undefined) {
      return -1;
    }

    if (b === undefined) {
      return 1;
    }

    if (a === b) {
      continue;
    }

    if (typeof a === 'number' && typeof b === 'number') {
      return a - b;
    }

    return String(a).localeCompare(String(b));
  }

  return 0;
}

export function compareVersions(left: string, right: string): number {
  const parsedLeft = parseVersion(left);
  const parsedRight = parseVersion(right);

  if (!parsedLeft && !parsedRight) {
    return left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' });
  }

  if (!parsedLeft) {
    return -1;
  }

  if (!parsedRight) {
    return 1;
  }

  for (let index = 0; index < 3; index += 1) {
    const a = parsedLeft.core[index] ?? 0;
    const b = parsedRight.core[index] ?? 0;

    if (a !== b) {
      return a - b;
    }
  }

  return comparePre(parsedLeft.pre, parsedRight.pre);
}
