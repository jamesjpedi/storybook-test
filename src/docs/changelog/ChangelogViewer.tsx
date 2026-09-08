import { useEffect, useState } from 'react';
import Markdown from 'react-markdown';

import './ChangelogViewer.css';

const changelogLoaders = import.meta.glob('./versions/*.md', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>;

function versionFromPath(path: string): string {
  const fileName = path.split('/').pop() ?? path;

  return fileName.replace(/\.md$/i, '');
}

const versions = Object.entries(changelogLoaders)
  .map(([path, load]) => ({
    id: versionFromPath(path),
    load,
  }))
  .sort((a, b) => b.id.localeCompare(a.id, undefined, { numeric: true, sensitivity: 'base' }));

export function ChangelogViewer() {
  const [selected, setSelected] = useState(versions[0]?.id ?? '');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(versions.length > 0);

  useEffect(() => {
    const version = versions.find((item) => item.id === selected);
    if (!version) {
      return;
    }

    let cancelled = false;

    version
      .load()
      .then((markdown) => {
        if (!cancelled) {
          setContent(markdown);
          setError(null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(`Could not load ${version.id}.md`);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selected]);

  if (versions.length === 0) {
    return (
      <p className="changelog-empty">
        No changelog files yet. Add a <code>.md</code> file in{' '}
        <code>src/docs/changelog/versions/</code>.
      </p>
    );
  }

  return (
    <div className="changelog-viewer">
      <label className="changelog-viewer__label" htmlFor="changelog-version">
        Version
        <select
          id="changelog-version"
          className="changelog-viewer__select"
          value={selected}
          onChange={(event) => {
            setSelected(event.target.value);
            setLoading(true);
            setError(null);
            setContent('');
          }}
        >
          {versions.map((version) => (
            <option key={version.id} value={version.id}>
              {version.id}
            </option>
          ))}
        </select>
      </label>

      <article className="changelog-viewer__content">
        {error ? <p className="changelog-empty">{error}</p> : null}
        {loading ? <p className="changelog-empty">Loading…</p> : null}
        {!loading && !error && content ? <Markdown>{content}</Markdown> : null}
      </article>
    </div>
  );
}
