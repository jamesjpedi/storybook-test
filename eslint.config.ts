import eslintJs from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import importX from 'eslint-plugin-import-x';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import { configs as storybookConfigs } from 'eslint-plugin-storybook';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const notTypeImport = '[^\\u0000]*$';

const importSortGroups = [
  // 1. External values: React, react-dom, react-router, then other packages by name
  [`^react$`, `^react/.+`, `^react-dom(/.*)?$`, `^react-router(/.*)?$`, `^@?\\w${notTypeImport}`],
  // 2. Internal (parent) — farther up the tree first (`../../` before `../`)
  [`^\\.\\.${notTypeImport}`],
  // 3. Current folder — alphabetically by path
  [`^\\./${notTypeImport}`],
  // 4. External type imports — React first, then by package name
  [
    '^react\\u0000$',
    '^react/.*\\u0000$',
    '^react-dom.*\\u0000$',
    '^react-router.*\\u0000$',
    '^@?\\w.*\\u0000$',
  ],
  // 5. Internal type imports
  ['^[.].*\\u0000$'],
  // 6. Style imports
  ['^.+\\.s?css$'],
  // 7. Other side-effect imports
  ['^\\u0000'],
];

const paddingLineBetweenStatements: [
  'error',
  ...{ blankLine: 'always' | 'any'; prev: string | string[]; next: string | string[] }[],
] = [
  'error',
  { blankLine: 'always', prev: 'import', next: '*' },
  { blankLine: 'any', prev: 'import', next: 'import' },
  { blankLine: 'always', prev: 'function', next: 'function' },
  { blankLine: 'always', prev: '*', next: 'function' },
  { blankLine: 'always', prev: 'function', next: '*' },
  { blankLine: 'always', prev: '*', next: 'export' },
  { blankLine: 'any', prev: 'export', next: 'export' },
  { blankLine: 'always', prev: '*', next: 'type' },
  { blankLine: 'always', prev: 'type', next: '*' },
  { blankLine: 'always', prev: '*', next: 'interface' },
  { blankLine: 'always', prev: 'interface', next: '*' },
  { blankLine: 'always', prev: '*', next: 'multiline-const' },
  { blankLine: 'always', prev: 'multiline-const', next: '*' },
  { blankLine: 'any', prev: 'singleline-const', next: 'singleline-const' },
  { blankLine: 'always', prev: '*', next: 'return' },
];

const barrelPaddingLineBetweenStatements: [
  'error',
  ...{ blankLine: 'always' | 'any'; prev: string | string[]; next: string | string[] }[],
] = [
  'error',
  { blankLine: 'always', prev: 'import', next: '*' },
  { blankLine: 'any', prev: 'import', next: 'import' },
  { blankLine: 'any', prev: 'export', next: 'export' },
];

const reactRecommended = react.configs.flat.recommended;
const reactJsxRuntime = react.configs.flat['jsx-runtime'];

if (!reactRecommended || !reactJsxRuntime) {
  throw new Error('eslint-plugin-react flat configs are unavailable.');
}

export default tseslint.config(
  {
    name: 'bhhc/ignores',
    ignores: [
      '**/node_modules/**',
      'dist/**',
      'dist-app/**',
      'storybook-static/**',
      'coverage/**',
      'package-lock.json',
      '.storybook/public/**',
      '.storybook/test.html',
    ],
  },
  eslintJs.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    name: 'bhhc/typescript-project',
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            '.storybook/*.ts',
            '.storybook/*.tsx',
            'prettier.config.js',
            'scripts/*.mjs',
          ],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    name: 'bhhc/browser-globals',
    files: ['src/**/*.{ts,tsx}', '.storybook/**/*.{ts,tsx}'],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    name: 'bhhc/node-globals',
    files: ['*.config.ts', 'vite.config.ts', 'vite.lib.config.ts', 'scripts/**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    name: 'bhhc/react',
    files: ['**/*.{ts,tsx}'],
    extends: [
      reactRecommended,
      reactJsxRuntime,
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      'react/prop-types': 'off',
      'react-hooks/exhaustive-deps': 'error',
    },
  },
  jsxA11y.flatConfigs.recommended,
  {
    name: 'bhhc/imports-and-layout',
    files: ['**/*.{ts,tsx,js,jsx,mjs,cjs}'],
    plugins: {
      '@stylistic': stylistic,
      'simple-import-sort': simpleImportSort,
      'import-x': importX,
    },
    rules: {
      'simple-import-sort/imports': ['error', { groups: importSortGroups }],
      'simple-import-sort/exports': 'error',
      'import-x/first': 'error',
      'import-x/newline-after-import': 'error',
      'import-x/no-duplicates': 'error',
      'import-x/no-default-export': 'error',
      'import-x/consistent-type-specifier-style': ['error', 'prefer-top-level'],
      '@stylistic/padding-line-between-statements': paddingLineBetweenStatements,
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
      'no-var': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
        },
      ],
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    name: 'bhhc/allow-default-export',
    files: [
      'src/App.tsx',
      'src/**/*.stories.{ts,tsx}',
      '.storybook/**/*.{ts,tsx}',
      '*.config.ts',
      '*.config.js',
      'vite.config.ts',
      'vite.lib.config.ts',
      '**/*.d.ts',
    ],
    rules: {
      'import-x/no-default-export': 'off',
    },
  },
  {
    name: 'bhhc/package-entries',
    files: ['src/exports/**'],
    rules: {
      'react-refresh/only-export-components': 'off',
      'simple-import-sort/exports': 'off',
      '@stylistic/padding-line-between-statements': barrelPaddingLineBetweenStatements,
    },
  },
  {
    name: 'bhhc/declaration-files',
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/consistent-type-definitions': 'off',
      'import-x/no-default-export': 'off',
    },
  },
  {
    name: 'bhhc/javascript',
    files: ['**/*.{js,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  {
    name: 'bhhc/eslint-config-file',
    files: ['eslint.config.ts'],
    rules: {
      // `tseslint.config()` is deprecated in favor of ESLint's `defineConfig()`,
      // but Storybook's plugin types are not compatible with that helper yet.
      '@typescript-eslint/no-deprecated': 'off',
    },
  },
  ...storybookConfigs['flat/recommended'],
  prettierRecommended,
);
