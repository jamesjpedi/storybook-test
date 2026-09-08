import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';

const root = dirname(fileURLToPath(import.meta.url));

const libEntries = {
  material: resolve(root, 'src/exports/material.ts'),
  'icons-material': resolve(root, 'src/exports/icons-material.ts'),
  system: resolve(root, 'src/exports/system.ts'),
  utils: resolve(root, 'src/exports/utils.ts'),
  lab: resolve(root, 'src/exports/lab.ts'),
  'styled-engine': resolve(root, 'src/exports/styled-engine.ts'),
  base: resolve(root, 'src/exports/base.ts'),
  'base-ui': resolve(root, 'src/exports/base-ui.ts'),
  'x-data-grid': resolve(root, 'src/exports/x-data-grid.ts'),
  'x-data-grid-pro': resolve(root, 'src/exports/x-data-grid-pro.ts'),
  'x-data-grid-premium': resolve(root, 'src/exports/x-data-grid-premium.ts'),
  'x-date-pickers': resolve(root, 'src/exports/x-date-pickers.ts'),
  'x-date-pickers-pro': resolve(root, 'src/exports/x-date-pickers-pro.ts'),
  'x-charts': resolve(root, 'src/exports/x-charts.ts'),
  'x-charts-pro': resolve(root, 'src/exports/x-charts-pro.ts'),
  'x-charts-premium': resolve(root, 'src/exports/x-charts-premium.ts'),
  'x-tree-view': resolve(root, 'src/exports/x-tree-view.ts'),
  'x-tree-view-pro': resolve(root, 'src/exports/x-tree-view-pro.ts'),
  'x-scheduler': resolve(root, 'src/exports/x-scheduler.ts'),
  'x-scheduler-premium': resolve(root, 'src/exports/x-scheduler-premium.ts'),
  'x-license': resolve(root, 'src/exports/x-license.ts'),
} as const;

function firstNonEmpty(...values: (string | undefined)[]): string {
  for (const value of values) {
    if (value !== undefined && value.length > 0) {
      return value;
    }
  }

  return '';
}

function isExternal(id: string): boolean {
  return (
    id === 'react' ||
    id === 'react-dom' ||
    id === 'react/jsx-runtime' ||
    id.startsWith('react/') ||
    id.startsWith('react-dom/') ||
    id.startsWith('@mui/') ||
    id.startsWith('@emotion/') ||
    id.startsWith('@base-ui/')
  );
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, root, '');
  const licenseKey = firstNonEmpty(process.env.MUI_X_LICENSE_KEY, env.MUI_X_LICENSE_KEY);

  if (!licenseKey) {
    throw new Error(
      'MUI_X_LICENSE_KEY is required to build the library. Set it in .env or the environment.',
    );
  }

  return {
    publicDir: false,
    plugins: [react()],
    define: {
      __MUI_X_LICENSE_KEY__: JSON.stringify(licenseKey),
    },
    build: {
      emptyOutDir: true,
      sourcemap: true,
      lib: {
        entry: Object.values(libEntries),
        formats: ['es'],
      },
      rollupOptions: {
        external: isExternal,
        output: {
          preserveModules: true,
          preserveModulesRoot: 'src',
          entryFileNames: '[name].js',
        },
      },
    },
  };
});
