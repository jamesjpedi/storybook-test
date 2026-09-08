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
```

Copy `.env.example` to `.env` and set `MUI_X_LICENSE_KEY` before `build:lib`.

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
