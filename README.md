# BHHC Storybook

React + TypeScript + Vite component library with Storybook.

## Scripts

```bash
npm install
npm run storybook      # Component explorer at http://localhost:6006
npm run dev            # Vite app
npm run build-storybook
```

## Layout

- `src/components` — Button and Card, with stories
- `src/docs/HowToUse.mdx` — usage guide
- `src/docs/changelog/versions` — one markdown file per changelog version

## Add a changelog version

Create a markdown file in `src/docs/changelog/versions/`. The filename (without `.md`) is the dropdown label. Semantic versioning is not required.
