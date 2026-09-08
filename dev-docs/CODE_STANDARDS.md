# Code standards

This repo uses **TypeScript**, **ESLint 9** (flat config), **Prettier**, **EditorConfig**, **Commitlint**, and **Husky + lint-staged**. They are wired so they do not fight each other: Prettier owns whitespace and quotes; ESLint owns correctness, React/TS rules, import order, and blank lines between statements.

`npm run lint` / `npm run typecheck` check the **whole tree**. Git hooks only run on **staged** files (and the commit message).

```text
staged files  -->  husky pre-commit  -->  lint-staged
                                         TS/JS: eslint --fix (includes prettier/prettier)
                                         md/json/css/mdx: prettier --write
commit message -->  husky commit-msg  -->  commitlint (Conventional Commits)
```

ESLint is pinned to **9.x** because `eslint-plugin-react` and `eslint-plugin-jsx-a11y` do not yet declare ESLint 10 support. `typescript-eslint` is **8.58+** so it understands TypeScript 6.

---

## How to run

| Script                 | What it does                                |
| ---------------------- | ------------------------------------------- |
| `npm run typecheck`    | `tsc -b` across app and node projects       |
| `npm run lint`         | `eslint . --max-warnings=0` (warnings fail) |
| `npm run lint:fix`     | Same, with `--fix`                          |
| `npm run format`       | Prettier write for the whole tree           |
| `npm run format:check` | Prettier check only                         |

Editor: format on save via Prettier; `source.fixAll.eslint` on save. Recommended extensions are in [`.vscode/extensions.json`](../.vscode/extensions.json).

---

## TypeScript compiler flags

Applied in [`tsconfig.app.json`](../tsconfig.app.json), [`tsconfig.lib.json`](../tsconfig.lib.json), and [`tsconfig.node.json`](../tsconfig.node.json) unless noted.

### Enabled

| Flag                                    | Why                                                                                                            |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `strict`                                | Latest baseline: `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, and the rest of the strict family |
| `useDefineForClassFields`               | ES2022 class field semantics                                                                                   |
| `verbatimModuleSyntax`                  | Imports must be type-only when they are types; no type/value confusion                                         |
| `erasableSyntaxOnly`                    | Bans `enum` / `namespace` so emit stays erasable (use unions / `as const`)                                     |
| `noUnusedLocals` / `noUnusedParameters` | Dead code is a type error (`_` prefix is allowed by ESLint)                                                    |
| `noFallthroughCasesInSwitch`            | Switch cases must `break` / `return`                                                                           |
| `noUncheckedSideEffectImports`          | Side-effect imports must resolve                                                                               |
| `noImplicitOverride`                    | `override` required when replacing a base member                                                               |
| `noImplicitReturns`                     | All code paths return a value                                                                                  |
| `noUncheckedIndexedAccess`              | `obj[key]` is `T \| undefined`                                                                                 |

```ts
// Bad — index access is T | undefined
const load = changelogLoaders[path];
load();

// Good
const versions = Object.entries(changelogLoaders).map(([path, load]) => ({
  id: versionFromPath(path),
  load,
}));
```

### Disabled (on purpose)

| Flag                         | Why                                                                                                                                                |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `exactOptionalPropertyTypes` | **Off.** MUI optional props (`prop?: T` meaning `T \| undefined`) commonly fail this flag. Revisit if wrappers stop colliding with `@mui/*` types. |

---

## Prettier

Config: [`prettier.config.js`](../prettier.config.js). Prettier issues on TS/TSX are ESLint errors via `prettier/prettier`.

| Option           | Value    |
| ---------------- | -------- |
| `semi`           | `true`   |
| `singleQuote`    | `true`   |
| `trailingComma`  | `all`    |
| `tabWidth`       | `2`      |
| `useTabs`        | `false`  |
| `endOfLine`      | `lf`     |
| `arrowParens`    | `always` |
| `bracketSpacing` | `true`   |
| `printWidth`     | `100`    |

```ts
// Bad
const fn = (x) => x;
const list = [1, 2];

// Good
const fn = (x: number) => x;
const list = [1, 2];
```

---

## EditorConfig

[`.editorconfig`](../.editorconfig): UTF-8, LF, 2-space indent, final newline, trim trailing whitespace (not trimmed in `*.md`).

---

## ESLint presets

Resolved from [`eslint.config.ts`](../eslint.config.ts) (see `eslint --print-config src/App.tsx`).

| Preset                                                        | Role                                                                                         |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `@eslint/js` recommended                                      | Core JS correctness                                                                          |
| `typescript-eslint` `strictTypeChecked`                       | Strict, type-aware TS rules                                                                  |
| `typescript-eslint` `stylisticTypeChecked`                    | TS style that is not Prettier’s job                                                          |
| `eslint-plugin-react` recommended + `jsx-runtime`             | React 17+ JSX transform                                                                      |
| `eslint-plugin-react-hooks` `recommended-latest`              | Rules of Hooks + React Compiler-oriented rules                                               |
| `eslint-plugin-react-refresh` Vite                            | Fast Refresh: files should export components                                                 |
| `eslint-plugin-jsx-a11y` recommended                          | Accessibility                                                                                |
| `eslint-plugin-storybook` `flat/recommended`                  | CSF stories                                                                                  |
| `eslint-plugin-simple-import-sort` + `eslint-plugin-import-x` | Import/export order                                                                          |
| `eslint-plugin-prettier/recommended` (**last**)               | Disables formatting rules that clash with Prettier **and** reports Prettier as ESLint errors |

Type-aware linting uses `parserOptions.projectService` with `tsconfigRootDir` at the repo root.

---

## Custom project rules (with examples)

These are set explicitly in `eslint.config.ts` (not only inherited).

### `simple-import-sort/imports` — **error**

Groups, top to bottom: side-effect → `node:` → `react` / `react-dom` → `@mui` / `@emotion` / `@base-ui` → other packages → parent → sibling.

```ts
// Bad
import { theme } from './theme';
import { Button } from '@mui/material';
import { useState } from 'react';
import './index.css';

// Good
import './index.css';

import { useState } from 'react';

import { Button } from '@mui/material';

import { theme } from './theme';
```

### `simple-import-sort/exports` — **error** (off in `src/exports/**`)

```ts
// Bad
export { Card } from './Card/Card';
export { Button } from './Button/Button';

// Good
export { Button } from './Button/Button';
export { Card } from './Card/Card';
```

Package barrels keep `export *` then local overrides, so export sorting is **off** under `src/exports/**`.

### `import-x/first` / `newline-after-import` / `no-duplicates` — **error**

```ts
// Bad
import { applyMuiXLicense } from '../license';
applyMuiXLicense();
import { Button } from '../components/Button/Button';

// Good
import { applyMuiXLicense } from '../license';

applyMuiXLicense();
```

### `import-x/no-default-export` — **error**, off for app/story/config entry files

```ts
// Bad in a library module
export default function Icon() {}

// Good
export function Icon() {}

// Allowed: src/App.tsx, *.stories.*, .storybook/*, *.config.ts, vite configs
export default App;
```

### `padding-line-between-statements` — **error**

Blank line after the import block, between function declarations, and before `return`.

```ts
// Bad
import { x } from './x';
function a() {
  return 1;
}
function b() {
  return 2;
}

// Good
import { x } from './x';

function a() {
  return 1;
}

function b() {
  return 2;
}
```

### `@typescript-eslint/consistent-type-imports` — **error** (`inline-type-imports`)

```ts
// Bad
import { ButtonProps } from '@mui/material';

// Good
import { Button, type ButtonProps } from '@mui/material';
```

### `@typescript-eslint/consistent-type-definitions` — **error** (`type`)

Off in `*.d.ts` so Vite `interface ImportMeta` merging still works.

```ts
// Bad
interface ButtonProps {
  label: string;
}

// Good
type ButtonProps = { label: string };
```

### `@typescript-eslint/no-unused-vars` — **error**

Unused bindings fail; names starting with `_` are ignored.

```ts
// Bad
function map(value: string) {}

// Good
function map(_value: string) {}
```

### `@typescript-eslint/no-non-null-assertion` — **error** (from strict preset)

```ts
// Bad
createRoot(document.getElementById('root')!).render(<App />);

// Good
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root was not found.');
}

createRoot(rootElement).render(<App />);
```

### `@typescript-eslint/prefer-nullish-coalescing` — **error**

Do not use `||` for nullish fallbacks. Empty-string env values are handled with an explicit length check (`firstNonEmpty` in the Vite configs), not `||`.

```ts
// Bad
const key = process.env.MUI_X_LICENSE_KEY || env.MUI_X_LICENSE_KEY || '';

// Good
const name = maybeName ?? 'anonymous';
```

### `eqeqeq` / `prefer-const` / `no-var` — **error**

```ts
// Bad
var count = 1;
if (count == 1) {
}

// Good
const count = 1;
if (count === 1) {
}
```

### `no-console` — **error** (`console.warn` / `console.error` allowed)

```ts
// Bad
console.log('debug');

// Good
console.error('build failed');
```

### `react/prop-types` — **off**

Types come from TypeScript.

```ts
// Not required
Button.propTypes = { children: PropTypes.node };
```

### `react/react-in-jsx-scope` / `react/jsx-uses-react` — **off**

React 17+ JSX transform; no `import React from 'react'` for JSX.

### `react-hooks/exhaustive-deps` — **error** (upgraded from the plugin’s warn)

```ts
// Bad
useEffect(() => {
  load(selected);
}, []);

// Good
useEffect(() => {
  load(selected);
}, [selected]);
```

### `react-refresh/only-export-components` — **error** (Vite), **off** in `src/exports/**`

```ts
// Bad in a component module
export const theme = createTheme();
export function Button() {}

// Good: constants allowed with Vite config (`allowConstantExport`)
export const VARIANTS = ['contained'] as const;
export function Button() {}
```

Barrel re-exports under `src/exports/**` are not components; the Fast Refresh rule is off there.

### `@typescript-eslint/no-deprecated` — **off** only in `eslint.config.ts`

`tseslint.config()` is marked deprecated in favor of ESLint’s `defineConfig()`, but Storybook’s plugin types are not compatible with that helper yet.

---

## File overrides

| Files                                                                    | Change                                                                       |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `src/App.tsx`, `*.stories.*`, `.storybook/**`, `*.config.ts`, `vite*.ts` | `import-x/no-default-export` off                                             |
| `src/exports/**`                                                         | `react-refresh/only-export-components` off; `simple-import-sort/exports` off |
| `**/*.d.ts`                                                              | `consistent-type-definitions` off; default export off                        |
| `**/*.{js,mjs,cjs}`                                                      | `typescript-eslint` type-checked rules disabled                              |
| `eslint.config.ts`                                                       | `@typescript-eslint/no-deprecated` off                                       |

Ignored by ESLint: `node_modules`, `dist`, `dist-app`, `storybook-static`, `coverage`, `package-lock.json`.

---

## Inherited error rules

Severity **error** unless you override. One-line meaning; examples above cover the project-specific ones.

### typescript-eslint (strict + stylistic, type-aware)

| Rule                                      | Meaning                                                                               |
| ----------------------------------------- | ------------------------------------------------------------------------------------- |
| `adjacent-overload-signatures`            | Keep overloads next to each other                                                     |
| `array-type`                              | Use `T[]`, not `Array<T>`                                                             |
| `await-thenable`                          | Only `await` thenables                                                                |
| `ban-ts-comment`                          | `@ts-ignore` / `@ts-expect-error` must be justified                                   |
| `ban-tslint-comment`                      | No TSLint comments                                                                    |
| `class-literal-property-style`            | Consistent class literal fields                                                       |
| `consistent-generic-constructors`         | `new Foo<T>()` style                                                                  |
| `consistent-indexed-object-style`         | Prefer `Record` / index signatures consistently                                       |
| `consistent-type-assertions`              | Prefer `as` assertions as configured                                                  |
| `dot-notation`                            | `obj.prop` over `obj['prop']` when possible                                           |
| `no-array-constructor`                    | Use `[]`, not `Array()`                                                               |
| `no-array-delete`                         | Do not `delete` array indexes                                                         |
| `no-base-to-string`                       | Do not stringify objects poorly                                                       |
| `no-confusing-non-null-assertion`         | `!` next to `=` is confusing                                                          |
| `no-confusing-void-expression`            | Do not use `void` expressions as values                                               |
| `no-deprecated`                           | No deprecated APIs                                                                    |
| `no-duplicate-enum-values`                | Enum members must be unique                                                           |
| `no-duplicate-type-constituents`          | No `A \| A`                                                                           |
| `no-dynamic-delete`                       | No `delete obj[key]`                                                                  |
| `no-empty-function`                       | Empty functions need a comment                                                        |
| `no-empty-object-type`                    | No `{}` as a type                                                                     |
| `no-explicit-any`                         | No `any`                                                                              |
| `no-extra-non-null-assertion`             | No `foo!!`                                                                            |
| `no-extraneous-class`                     | No class used only as a namespace                                                     |
| `no-floating-promises`                    | Promises must be awaited or voided                                                    |
| `no-for-in-array`                         | Do not `for-in` arrays                                                                |
| `no-generated-empty-object-type`          | No generated `{}` types                                                               |
| `no-implied-eval`                         | No `setTimeout('code')`                                                               |
| `no-inferrable-types`                     | Do not write `: number = 1`                                                           |
| `no-invalid-void-type`                    | `void` only in valid positions                                                        |
| `no-meaningless-void-operator`            | No useless `void`                                                                     |
| `no-misused-new`                          | Correct `new` in interfaces                                                           |
| `no-misused-promises`                     | Do not pass promises where a boolean/void is expected                                 |
| `no-misused-spread`                       | Do not spread non-objects unsafely                                                    |
| `no-mixed-enums`                          | Do not mix number/string enums                                                        |
| `no-namespace`                            | No `namespace` (use modules)                                                          |
| `no-non-null-asserted-nullish-coalescing` | No `foo! ?? bar`                                                                      |
| `no-non-null-asserted-optional-chain`     | No `foo?.bar!`                                                                        |
| `no-non-null-assertion`                   | No `!`                                                                                |
| `no-redundant-type-constituents`          | No `string \| any`                                                                    |
| `no-require-imports`                      | No `require()`                                                                        |
| `no-this-alias`                           | No `const self = this`                                                                |
| `no-unnecessary-boolean-literal-compare`  | No `flag === true`                                                                    |
| `no-unnecessary-condition`                | No always-truthy checks                                                               |
| `no-unnecessary-template-expression`      | No `` `${'x'}` ``                                                                     |
| `no-unnecessary-type-arguments`           | No default type args restated                                                         |
| `no-unnecessary-type-assertion`           | No extra `as`                                                                         |
| `no-unnecessary-type-constraint`          | No `<T extends any>`                                                                  |
| `no-unnecessary-type-conversion`          | No `String(string)`                                                                   |
| `no-unnecessary-type-parameters`          | No unused generics                                                                    |
| `no-unsafe-*`                             | No `any` leaking into args, assigns, calls, members, returns                          |
| `no-unsafe-declaration-merging`           | No unsafe merge                                                                       |
| `no-unsafe-enum-comparison`               | Compare enums correctly                                                               |
| `no-unsafe-function-type`                 | No `Function` type                                                                    |
| `no-unsafe-unary-minus`                   | Unary minus only on numbers                                                           |
| `no-unused-expressions`                   | No `foo && foo()` as a statement unless allowed                                       |
| `no-unused-vars`                          | No unused bindings                                                                    |
| `no-useless-constructor`                  | No empty constructors                                                                 |
| `no-useless-default-assignment`           | No default that is already the type default                                           |
| `no-wrapper-object-types`                 | Use `string`, not `String`                                                            |
| `non-nullable-type-assertion-style`       | Prefer `!` vs `as` consistently — with `no-non-null-assertion`, use narrowing instead |
| `only-throw-error`                        | `throw` only `Error` values                                                           |
| `prefer-as-const`                         | Use `as const`                                                                        |
| `prefer-find`                             | Use `find` over filter\[0\]                                                           |
| `prefer-for-of`                           | `for-of` over index loops                                                             |
| `prefer-function-type`                    | Call signatures as function types                                                     |
| `prefer-includes`                         | `includes` over `indexOf`                                                             |
| `prefer-literal-enum-member`              | Enum members are literals                                                             |
| `prefer-namespace-keyword`                | `namespace` not `module` (still banned by `no-namespace`)                             |
| `prefer-nullish-coalescing`               | `??` over `\|\|` for nullish                                                          |
| `prefer-optional-chain`                   | `?.` over nested `&&`                                                                 |
| `prefer-promise-reject-errors`            | Reject with `Error`                                                                   |
| `prefer-reduce-type-parameter`            | Type `reduce` via generic                                                             |
| `prefer-regexp-exec`                      | `RegExp#exec` vs `String#match`                                                       |
| `prefer-return-this-type`                 | Fluent APIs return `this`                                                             |
| `prefer-string-starts-ends-with`          | `startsWith` / `endsWith`                                                             |
| `related-getter-setter-pairs`             | Getter/setter types match                                                             |
| `require-await`                           | `async` functions must await                                                          |
| `restrict-plus-operands`                  | `+` only on compatible types                                                          |
| `restrict-template-expressions`           | Template values must be safe to stringify                                             |
| `return-await`                            | Consistent `return await`                                                             |
| `triple-slash-reference`                  | Limit `///` refs                                                                      |
| `unbound-method`                          | Do not pass unbound methods                                                           |
| `unified-signatures`                      | Merge overload signatures                                                             |
| `use-unknown-in-catch-callback-variable`  | Catch as `unknown`                                                                    |

```ts
// Bad — no-explicit-any, no-floating-promises, no-misused-promises
function load(data: any) {
  fetch('/api');
}
<button onClick={load} />

// Good
function load(data: unknown) {
  void fetch('/api');
}
```

### ESLint core

`for-direction`, `no-async-promise-executor`, `no-case-declarations`, `no-compare-neg-zero`, `no-cond-assign`, `no-constant-binary-expression`, `no-constant-condition`, `no-control-regex`, `no-debugger`, `no-delete-var`, `no-dupe-else-if`, `no-duplicate-case`, `no-empty`, `no-empty-character-class`, `no-empty-pattern`, `no-empty-static-block`, `no-ex-assign`, `no-extra-boolean-cast`, `no-fallthrough`, `no-global-assign`, `no-invalid-regexp`, `no-irregular-whitespace`, `no-loss-of-precision`, `no-misleading-character-class`, `no-nonoctal-decimal-escape`, `no-octal`, `no-prototype-builtins`, `no-regex-spaces`, `no-self-assign`, `no-shadow-restricted-names`, `no-sparse-arrays`, `no-unsafe-finally`, `no-unsafe-optional-chaining`, `no-unused-labels`, `no-unused-private-class-members`, `no-useless-backreference`, `no-useless-catch`, `no-useless-escape`, `prefer-rest-params`, `prefer-spread`, `require-yield`, `use-isnan`, `valid-typeof`.

```ts
// Bad
if (x == NaN) {
}
debugger;

// Good
if (Number.isNaN(x)) {
}
```

### React

`display-name`, `jsx-key`, `jsx-no-comment-textnodes`, `jsx-no-duplicate-props`, `jsx-no-target-blank`, `jsx-no-undef`, `jsx-uses-vars`, `no-children-prop`, `no-danger-with-children`, `no-deprecated`, `no-direct-mutation-state`, `no-find-dom-node`, `no-is-mounted`, `no-render-return-value`, `no-string-refs`, `no-unescaped-entities`, `no-unknown-property`, `require-render-return`.

```ts
// Bad
{items.map((item) => <li>{item}</li>)}
<a href="https://example.com" target="_blank">x</a>

// Good
{items.map((item) => (
  <li key={item.id}>{item}</li>
))}
<a href="https://example.com" target="_blank" rel="noreferrer">
  x
</a>
```

### React Hooks (`recommended-latest`)

**Error:** `rules-of-hooks`, `exhaustive-deps`, `config`, `error-boundaries`, `gating`, `globals`, `immutability`, `preserve-manual-memoization`, `purity`, `refs`, `set-state-in-effect`, `set-state-in-render`, `static-components`, `use-memo`, `void-use-memo`.

```ts
// Bad
if (ready) {
  useState(0);
}

// Good
const [value, setValue] = useState(0);
```

### jsx-a11y

`alt-text`, `anchor-has-content`, `anchor-is-valid`, `aria-*`, `autocomplete-valid`, `click-events-have-key-events`, `heading-has-content`, `html-has-lang`, `iframe-has-title`, `img-redundant-alt`, `interactive-supports-focus`, `label-has-associated-control`, `media-has-caption`, `mouse-events-have-key-events`, `no-access-key`, `no-autofocus`, `no-distracting-elements`, `no-interactive-element-to-noninteractive-role`, `no-noninteractive-element-interactions`, `no-noninteractive-element-to-interactive-role`, `no-noninteractive-tabindex`, `no-redundant-roles`, `no-static-element-interactions`, `role-has-required-aria-props`, `role-supports-aria-props`, `scope`, `tabindex-no-positive`.

```tsx
// Bad
<img src="/logo.png" />
<div onClick={onOpen} />

// Good
<img src="/logo.png" alt="BHHC" />
<button type="button" onClick={onOpen}>
  Open
</button>
```

### Other errors

| Rule                                   | Meaning                                             |
| -------------------------------------- | --------------------------------------------------- |
| `prettier/prettier`                    | Code must match Prettier                            |
| `react-refresh/only-export-components` | Fast Refresh: export components (constants allowed) |

---

## Warning rules

Only these two are **warn** (React Hooks compiler guidance). `--max-warnings=0` still **fails CI / lint-staged** if they fire.

| Rule                               | Meaning                                             | Example                                   |
| ---------------------------------- | --------------------------------------------------- | ----------------------------------------- |
| `react-hooks/incompatible-library` | A library pattern conflicts with the React Compiler | Mixing compiler-incompatible memo helpers |
| `react-hooks/unsupported-syntax`   | Syntax the compiler cannot analyze                  | Dynamic hook names                        |

Treat them as errors in practice: fix or change the code; do not leave warnings in staged files.

---

## Disabled rules

### Explicitly disabled by this repo

| Rule                                             | Where                      | Why                                    | Example that is allowed                    |
| ------------------------------------------------ | -------------------------- | -------------------------------------- | ------------------------------------------ |
| `react/prop-types`                               | all                        | TypeScript types                       | `export type ButtonProps = MuiButtonProps` |
| `react/react-in-jsx-scope`                       | all                        | JSX runtime                            | `<Button />` without importing React       |
| `react/jsx-uses-react`                           | all                        | JSX runtime                            | same                                       |
| `import-x/no-default-export`                     | App, stories, configs, dts | Tooling requires default export        | `export default meta`                      |
| `react-refresh/only-export-components`           | `src/exports/**`           | `export *` barrels                     | `export * from '@mui/material'`            |
| `simple-import-sort/exports`                     | `src/exports/**`           | Keep `export *` then overrides         | `export *` then `export { Button }`        |
| `@typescript-eslint/consistent-type-definitions` | `*.d.ts`                   | Declaration merging                    | `interface ImportMeta { ... }`             |
| `@typescript-eslint/no-deprecated`               | `eslint.config.ts`         | `tseslint.config()` types vs Storybook | `export default tseslint.config(...)`      |

### Turned off because TypeScript already handles them

Core rules such as `no-undef`, `no-unused-vars`, `no-redeclare`, `constructor-super`, `getter-return`, `no-dupe-args`, `no-dupe-keys`, `no-unreachable` are off for `.ts`/`.tsx` (typescript-eslint `eslintRecommended`). Use the `@typescript-eslint/*` equivalents instead.

```ts
// Bad — still caught by @typescript-eslint/no-unused-vars
const unused = 1;

// The core no-unused-vars is off so the two rules do not double-report.
```

### Turned off by eslint-config-prettier (~formatting)

`eslint-plugin-prettier/recommended` sets a large set of stylistic rules to **off** (indent, quotes, semi, braces, Vue/Unicorn/Stylistic compatibility entries, and similar). **Do not re-enable them.** Prettier is the formatter.

```ts
// Prettier decides this, not ESLint indent/quotes:
const label = 'Save';
```

To see the full resolved map (including every prettier-compat `off`):

```bash
npx eslint --print-config src/App.tsx
```

---

## Commitlint

[`commitlint.config.ts`](../commitlint.config.ts) extends `@commitlint/config-conventional`.

- Header max **100** characters
- Body lines max **100** characters
- Type must be one of: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`

```text
# Bad
updated stuff
Added linting!

# Good
feat: add ESLint, Prettier, and commit hooks

fix: guard missing root element before createRoot

docs: document lint and TypeScript rules
```

---

## Husky and lint-staged

On `npm install`, `prepare` runs `husky`.

| Hook                | Command                      | Scope                 |
| ------------------- | ---------------------------- | --------------------- |
| `.husky/pre-commit` | `npx lint-staged`            | **Staged files only** |
| `.husky/commit-msg` | `npx commitlint --edit "$1"` | Commit message        |

lint-staged:

- `*.{ts,tsx,js,jsx,mjs,cjs}` → `eslint --fix --max-warnings=0`
- `*.{json,md,mdx,css,yml,yaml,html}` → `prettier --write`

Unstaged files are not rewritten. To check everything locally: `npm run format:check`, `npm run lint`, and `npm run typecheck`.

## Azure DevOps CI

[azure-pipelines.yml](../azure-pipelines.yml) enforces the same standards on the **whole tree** (hooks only cover staged files):

| Step                                 | When          | Command                                       |
| ------------------------------------ | ------------- | --------------------------------------------- |
| Commitlint                           | Pull requests | `commitlint --from origin/<target> --to HEAD` |
| Prettier                             | Every CI run  | `npm run format:check`                        |
| ESLint (includes Prettier on TS/TSX) | Every CI run  | `npm run lint` (`--max-warnings=0`)           |
| Typecheck                            | Every CI run  | `npm run typecheck`                           |

`npm ci` sets `HUSKY=0` so install does not install git hooks on the agent. Merge commits are ignored by Commitlint’s default ignores.
