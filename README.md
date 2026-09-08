# BHHC design system

React 18 design system published as `bhhc-design-system`. It re-exports MUI Material, Core, and X on MUI-style subpaths, with BHHC overrides for Button, Card, and Data Grid. The MUI X license is signed inside this package.

## Scripts

```bash
npm install
npm run storybook      # Component explorer at http://localhost:6006
npm run dev            # Vite demo app
npm run build          # Vite demo app to dist-app/
npm run build:lib      # Library build for npm (requires MUI_X_LICENSE_KEY)
npm run build-storybook
npm run typecheck      # TypeScript project build (no emit)
npm run lint           # ESLint + Prettier on TS/TSX (whole tree)
npm run lint:fix       # Autofix lint and formatting
npm run format         # Prettier write on all supported files
npm run format:check  # Prettier check (CI)
```

Copy `.env.example` to `.env` and set `MUI_X_LICENSE_KEY` before `build:lib`.

Code style, TypeScript, ESLint, Prettier, and commit hooks are documented in [dev-docs/CODE_STANDARDS.md](dev-docs/CODE_STANDARDS.md). Commits only lint **staged** files; Azure DevOps checks the whole tree.

## Azure DevOps

[azure-pipelines.yml](azure-pipelines.yml) runs on PRs and `main`:

1. **Commitlint** (pull requests only) — Conventional Commits on the PR range
2. **Prettier** (`format:check`) and **ESLint** (`lint`, including Prettier on TS/TSX)
3. **Typecheck**
4. **`build:lib`** (MUI X signing) and Storybook
5. Publishes `bhhc-design-system` to Azure Artifacts when you push a `v*` tag (for example `v0.1.0`)

Setup:

1. Create pipeline variable **`MUI_X_LICENSE_KEY`** (secret). Do not commit the key.
2. Create an Azure Artifacts npm feed. Set pipeline variable **`npmFeed`** to that feed name (default in YAML: `bhhc-design-system`).
3. Give the project **Build Service** account **Contributor** on the feed.
4. Bump `"version"` in `package.json`, commit, and tag: `git tag v0.1.0 && git push origin v0.1.0`.

## Layout

- `src/exports` — package entry points (`material`, `x-data-grid-premium`, …)
- `src/components` — Button, Card, DataGrid overrides and stories
- `src/docs/GettingStarted.mdx` — consumer install guide (also [GETTING_STARTED.md](GETTING_STARTED.md))
- `src/docs/HowToUse.mdx` — usage guide
- `src/docs/changelog/versions` — one markdown file per changelog version

## Consumer apps

See [GETTING_STARTED.md](GETTING_STARTED.md).

## Add a changelog version

Create a markdown file in `src/docs/changelog/versions/`. The filename (without `.md`) is the dropdown label. Semantic versioning is not required.
