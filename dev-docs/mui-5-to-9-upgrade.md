# Material UI 5 to 9

Briefing for a React and TypeScript component library that moved Material UI from v5 to v9, and for the React TypeScript apps that consume it. The useful property of that stack is that most of the break is a `tsc` error, not a silent runtime change. Facts are from MUI’s version matrix, support policy, upgrade guides, and release posts, checked 23 October 2026. This is `@mui/material`. MUI X (Data Grid, pickers, charts) was numbered separately from 2023 until both landed on v9.

## Verdict

> **The upgrade is justified, and it is not free.** Material UI v5 shipped on 16 September 2021 and is unsupported. v6 and the skipped v8 are unsupported too. The only supported lines on the current matrix are v9 (stable, continuous fixes) and v7 (long-term support for security issues and regressions). Moving the library to v9 puts every consumer on the line MUI will still change. The price is three accumulated majors of API cleanup, not a new styling engine.

|                 |                           |
| --------------- | ------------------------- |
| **v8 skipped**  | 5, then 6, 7, and 9       |
| **Unsupported** | Material UI v5 and v6     |
| **v7 LTS**      | Only supported older line |
| **React 17–19** | v9 peer range, still wide |

### What you can say in the room

We stayed on the styling model v5 introduced in 2021: Emotion at runtime, the `sx` prop, and `styled`. v9 does not replace that. Pigment CSS, the zero-runtime engine announced with v6, is still alpha and MUI has paused it. Claiming a bundle-size revolution from dropping Emotion would be false.

What did change is the contract around that engine. v6 removed the legacy UMD build and cut about 2.5 MB from the `@mui/material` package, roughly a quarter of the v5 package. v9 is about 3% smaller than v7 again, and heavy `sx` usage is up to 30% faster. Keyboard behavior, grid layout, and the slot API were cleaned up on purpose, with codemods, across August 2024, March 2025, and April 2026.

These consumers are React TypeScript apps. They do not have to jump to React 19: v9 still peers React 17, 18, and 19. They do have to reach TypeScript 4.9, and a Vite or webpack app should be on TypeScript 5 with `moduleResolution: "bundler"` so the editor and the bundler agree. Removed props then fail `tsc` in the app’s own JSX. They also have to run one copy of `@mui/material`. Two copies, the library on v9 and the app still on v5, split the theme context and double the styles.

### Do this

- Ship the library as its own major, with `@mui/material` and `@mui/system` at `^9` in `peerDependencies`, not bundled inside the package.
- Keep the previous library major available for apps that need another quarter. Point that line at Material UI v7, which is still in long-term support, rather than at v5.
- Tell each app to run the codemods, then `tsc --noEmit`. The compiler is the checklist. After it is clean, visually check grid spacing, accordion markup, menu and tab focus, and any `theme.palette.mode` branch.

### Do not claim

- That v9 is drop-in for v5 application code. System props, `components` / `componentsProps`, `Grid` breakpoint props, and `GridLegacy` are gone.
- That server components or Tailwind now work without setup. CSS layers are opt-in. Most Material UI components are still client components on Emotion.
- That MUI X pricing is unchanged. From 8 April 2026, Pro and Premium moved to application-based licensing. That matters only if a consumer uses paid MUI X.

Sources: MUI support matrix and versions page; Material UI v6, v7, and v9 announcements; upgrade guides for v6, v7, and v9; “2026 and beyond” status post for Pigment CSS and Joy UI; MUI X support matrix.

## Timeline

### Release line

Material UI aims at a major about every 12 months. The gap from v5 to v6 was almost three years. After that, majors returned to the yearly cadence. v8 was skipped the same way v2 once was, so Material UI and MUI X could share a number again.

| Line        | Version | Date        | Status on 23 Oct 2026 | Why it existed                                                                                        |
| ----------- | ------- | ----------- | --------------------- | ----------------------------------------------------------------------------------------------------- |
| Material UI | 5.0.0   | 16 Sep 2021 | Unsupported           | Emotion replaces JSS. sx, styled, @mui/* package names.                                               |
| Material UI | 6.0.0   | 26 Aug 2024 | Unsupported           | CSS variables, stable Grid v2, Pigment CSS opt-in, drop IE 11 and UMD.                                |
| Material UI | 7.0.0   | 26 Mar 2025 | Long-term support     | Real ESM exports, slots finished, v5-deprecated APIs removed.                                         |
| Material UI | 8       | Skipped     | Never shipped         | Number reserved so the suite could meet MUI X at v9.                                                  |
| Material UI | 9.0.0   | 7 Apr 2026  | Stable, current       | Accessibility, sx performance, deprecated APIs removed. Minors have continued (9.2 in the changelog). |

Material UI dates from the support matrix, except v9.0.0 which the changelog dates 7 April 2026. The support matrix and the MUI X v9 release use 8 April 2026 for the coordinated suite release.

### MUI X, so nobody mixes the numbers

From MUI X v6 in 2023 until v9, advanced components used their own major. A consumer can be “on MUI 5” for Material UI and “on MUI X 7” for the Data Grid at the same time. v9 ends that split. MUI X v9 requires `@mui/material` and `@mui/system` at `^7.3.0` or `^9.0.0`. v5 and v6 of Material UI are no longer accepted.

| MUI X | Released    | Support                          |
| ----- | ----------- | -------------------------------- |
| 5.0.0 | 23 Nov 2021 | Out of support since 3 Mar 2025  |
| 6.0.0 | 3 Mar 2023  | Out of support since 23 Mar 2026 |
| 7.0.0 | 23 Mar 2024 | LTS until 17 Apr 2027            |
| 8.0.0 | 17 Apr 2025 | LTS until 8 Apr 2028             |
| 9.0.0 | 8 Apr 2026  | Current stable                   |

Source: MUI X support page. MUI X LTS is two years of security fixes and regression fixes. Material UI’s policy is narrower: continuous work on the current major, and security plus regressions on the immediate predecessor only. Because v8 was skipped, that predecessor is v7.

### Minimum browser major targeted by the stable bundle

Version number of the oldest browser the default bundle still compiles for. Higher means older enterprise browsers fall off.

| Browser        | v5  | v6 and v7 | v9  |
| -------------- | --- | --------- | --- |
| Chrome         | 90  | 109       | 117 |
| Firefox        | 78  | 115       | 121 |
| Safari (macOS) | 14  | 15.4      | 17  |

Source: Material UI upgrade guides, stable browserslist. v5 floors are the “up from” figures in the v6 guide (Chrome 90, Edge 91, Firefox 78, Safari 14 on macOS and 12.5 on iOS). v6 raised those to Chrome 109, Edge 121, Firefox 115, Safari 15.4, and Node.js 14. The v7 guide does not raise browsers again. v9 raises Chrome to 117, Firefox to 121, and Safari to 17.0 on macOS and iOS. Edge stays at 121. IE 11 was removed entirely in v6.

## Why and why not

### Why move the library

| Reason                                      | What is actually true                                                                                                                                                                                                                                          |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| v5 is out of support                        | No committed security or browser-regression fixes. A late v5.18.0 in July 2025 backported CSS layers, and v5.16.12 in December 2024 added React 19 compatibility. Those were catch-up releases, not a support window.                                          |
| One break instead of three                  | v6, v7, and v9 each removed another layer of deprecated API. Doing it inside the library once means consumer apps take one library major, not three staggered peer bumps.                                                                                      |
| Modern packaging                            | v7 replaced faux ESM with a real exports map. Vite, webpack, and Node ESM stop needing the old modern-bundle aliases. Deep imports such as `@mui/material/styles/createTheme` fail closed. That is a feature: those paths were private.                        |
| Less runtime waste, same engine             | UMD removal in v6, about 3% off v7 in v9, and up to 30% faster heavy sx (PR 44254). Emotion is still the default. The win is less dead code and a faster sx path, not a new compiler.                                                                          |
| Accessibility is the product change         | v9’s own announcement leads with keyboard behavior, focus, and DOM semantics: roving tabindex on Tabs, Menu, and Stepper; Accordion summary as a button; vertical Divider as a separator; Slider on pointer events; Backdrop no longer aria-hidden by default. |
| Theming matches CSS                         | CSS variables and color schemes are stable. `color-mix()` derives overlay colors. `theme.applyStyles` replaces `palette.mode` branches. Opt-in CSS layers let Material UI sit under Tailwind v4.                                                               |
| Grid stops lying about its box              | The current Grid uses CSS gap, drops the `item` prop, allows offset, and does not overflow the parent with negative margins. Nested grids are not depth-limited.                                                                                               |
| MUI X v9 will not install on Material UI v5 | Consumers who want Data Grid, pickers, or charts on the current major must be on Material UI 7.3 or 9. A library pinned to v5 blocks that upgrade.                                                                                                             |
| New primitives are on v9 only               | NumberField and Menubar (with submenus) ship on Base UI inside Material UI v9. They will not be backported to v5.                                                                                                                                              |

### Why someone can reasonably object

| Objection                             | Answer to give                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Emotion is still there                | Correct. v6 said later majors would likely default to Pigment CSS. The 2026 status post says Pigment CSS is alpha and on hold, after Base UI took priority. v9’s “what’s next” still lists removing Emotion. Do not sell a migration that has not happened.                                                                                                                                           |
| v7 is still supported                 | Correct, and it is the honest fallback. v7 already has ESM, slots, CSS layers, and the new Grid name. It does not get v9’s accessibility pass, the sx speedup, NumberField, Menubar, or the default pairing with MUI X v9. It also still contains GridLegacy, which v9 deletes. Stopping on v7 means another breaking library major when v10 ships (the cadence is about 12 months, so plan on 2027). |
| Layouts will move                     | The highest visual risk. Gap spacing changes how item boxes are measured. A v6 Grid container does not default to width 100%. v9 rejects `direction="column"`. Apps that used Grid as a vertical stack must use Stack.                                                                                                                                                                                |
| App code uses margin props everywhere | `mt`, `p`, `bgcolor`, and the rest of the system props are removed from Box, Stack, Grid, Typography, Link, DialogContentText, and the Timeline content components. The `sx` prop still does the same job. A codemod covers direct JSX. It misses props passed through spreads, variables, or your own wrappers.                                                                                      |
| Our theme reads palette.mode          | If CSS variables and colorSchemes are on, toggling dark mode no longer swaps the theme object. `theme.palette.mode` stays on the default. Styles that branch on it silently keep the light value. Use `theme.vars`, `theme.applyStyles`, or set `forceThemeRerender`. The library should leave `cssVariables` off unless a consumer opts in.                                                          |
| We still support old browsers         | v9’s floor is Chrome 117, Firefox 121, Safari 17. If a consumer has a contractual IE 11 or Safari 15 requirement, they cannot take this library major. v5’s IE 11 bundle has had no fixes since v6.                                                                                                                                                                                                   |
| Tests and CSS selectors will fail     | AccordionSummary, Stepper, and vertical Divider changed elements. Keyboard activation on buttons now emits a bubbling MouseEvent. Ripple tests need `act()`. Icons dropped their default `data-testid` in production bundles in v7. MenuItem outside Menu throws.                                                                                                                                     |
| Paid MUI X changed commercial terms   | From 8 April 2026, Pro and Premium are application-licensed, priority support is Enterprise-only, and commercial components send telemetry in development (off in production, opt-out documented). Existing v8 customers can keep renewing v8 at the old price. This is independent of the open-source Material UI upgrade, but it lands in the same conversation if the grid is in the app.          |

> **Dead ends that v5 apps may still be sitting on.** `@mui/styles` (`makeStyles`, `withStyles`) was the JSS compatibility package. Its code and docs were removed from the repository in March 2025. It is not part of the v9 upgrade path; apps still on it have a separate migration to `styled` or `sx` before the new library will feel native. Joy UI was removed from the same repository in the v9 cycle and is on hold as a product. Base UI (the unstyled successor to the old MUI Base) is the foundation MUI is actually building on, and Material UI v9 consumes it for NumberField and Menubar.

## What each major bought

### v5, what the library was built on

v5 was a real platform change: JSS out, Emotion in, `@material-ui/*` renamed to `@mui/*`, the `sx` prop, and the system. CSS variables existed only as `experimental_extendTheme` and `Experimental_CssVarsProvider`. Grid v2 was `Unstable_Grid2`. That stack was the right one to sit on for two years. It is now the unsupported stack.

### v6 — 26 August 2024

Designed as a small break. MUI’s own guide says the required changes are browsers, Node, and the UMD bundle. The deprecations could wait. Those deprecations are what v7 and v9 later deleted.

**Gained.** `ThemeProvider` absorbs the CSS-variables provider. Container queries. `theme.applyStyles` for light and dark. Grid2 stabilized: `size` and `offset` props, CSS gap, no negative-margin overflow. `LoadingButton` leaves Lab and becomes `Button` loading state in v6.4. Optional Pigment CSS and a few RSC-capable layout components under `@mui/material-pigment-css`.

**Broke.** IE 11 and the UMD build are gone. TypeScript minimum moves from 3.5 to 4.7. `ListItem button` is removed in favor of `ListItemButton`. Accordion summary is wrapped in a heading and, from v6.3, its root is a button. Vertical Divider is no longer an `hr`. Chip keeps focus on Escape. Autocomplete adds blur, selectOption, and removeOption reasons. Ripple timing changes tests. React 17 and 18 need a `react-is` override because the package depends on `react-is@19`.

### v7 — 26 March 2025

The packaging and API-consistency release. MUI described the upgrade as straightforward. It is straightforward only after v6 deprecations are gone from the app.

**Gained.** Valid ESM and CommonJS through `exports`. Slot API completed: `slots` and `slotProps` everywhere, replacing `components`, `componentsProps`, `TransitionComponent`, and `*Props`. Opt-in CSS layer (`enableCssLayer`) so Tailwind v4 can order `theme, base, mui, components, utilities`. Deprecated v5 APIs removed, which shortens the docs.

**Broke.** Deep imports and `@mui/material/modern` aliases stop resolving. Theme augmentations must target `@mui/material/styles`, and some interfaces were renamed (`TypographyOptions` to `TypographyVariantsOptions`). Old `Grid` becomes `GridLegacy`. `Grid2` becomes `Grid`. `Hidden` is removed. `createMuiTheme` and `experimentalStyled` are removed. `onBackdropClick` is removed from Dialog and Modal. Lab re-exports of Alert, Autocomplete, Pagination, Rating, Skeleton, SpeedDial, ToggleButton, and `usePagination` must be imported from `@mui/material`. TypeScript minimum is 4.9. With CSS variables and built-in color schemes, the theme object no longer re-renders on mode change.

### v9 — 7 April 2026

There is no Material UI v8. v9 is the cleanup of everything deprecated through v7, plus the accessibility pass, synchronized with MUI X v9.

**Gained.** NumberField and Menubar. Roving tabindex on Stepper, Tabs, and MenuList. `color-mix()` values generated from the CSS-variable theme. A root slot on Autocomplete. About 3% smaller than v7. Heavy `sx` up to 30% faster. Switch border for high-contrast mode. Table pagination numbers follow `Intl.NumberFormat` for the locale.

**Broke.** `GridLegacy` is deleted. `Grid direction="column"` is rejected. System props are deleted from the layout components. The whole deprecated slot-prop family is deleted (`components`, `componentsProps`, `ListboxComponent`, `PaperComponent`, `renderTags`, `inputProps`, `imgProps`, `disableEscapeKeyDown`, and the composed CSS class names such as `MuiAlert-standardSuccess`). 23 duplicate `*Outline` icon exports are removed; use `*Outlined`. `MenuItem` and `Tab` throw when rendered outside their parent. Slider listens to pointer events. Stepper renders `ol` / `li`. Browser floor moves to Chrome 117, Firefox 121, Safari 17.

> **What v9 explicitly postponed.** The suite announcement lists the next major’s research as independence from Emotion, a better Tailwind path, and a theme layer that can wear Material Design or a brand without overriding every class. Those are not in the build you are shipping.

## React and TypeScript

### What a React TypeScript app actually has to change

The library and its consumers are React apps written in TypeScript. That is the low-impact path. Material UI v9 deletes props from the public types, so `sx` shortcuts, old Grid props, and `componentsProps` fail compilation in the app’s own files. A JavaScript app would find those same mistakes at runtime. Here the migration is: codemod, then `tsc --noEmit`, then a short visual pass for the changes TypeScript cannot see.

> **React version can stay where it is.** `@mui/material` v9 peers `react` and `react-dom` at `^17 || ^18 || ^19`, and the same range for `@types/react`. A React 18 app does not upgrade React to take this library. It must keep `@types/react` and `@types/react-dom` on major 18 as well. Installing `@types/react@19` beside `react@18` produces ref and `ReactNode` errors that look like an MUI failure and are not one.

### tsconfig that makes the editor match the bundler

v7 started shipping a real `exports` map. Deep imports such as `@mui/material/styles/createTheme` are private and no longer resolve. TypeScript only enforces that map when module resolution understands `exports`. `"moduleResolution": "node"` (the old Node 10 resolver) does not. `tsc` can stay green while Vite or webpack fails the build, or the reverse.

| Setting          | Use this                            | Why                                                                                                                                                         |
| ---------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| typescript       | 5.0 or newer                        | MUI’s hard minimum is 4.9. `moduleResolution` `bundler` exists from 5.0, which is what a Vite or webpack React app wants.                                   |
| moduleResolution | bundler                             | Honors the exports map and still allows extensionless imports. `node16` and `nodenext` also honor exports, and are stricter than a typical React app needs. |
| jsx              | react-jsx                           | The automatic runtime these apps already use. The v6 removal of the UMD build does not affect a bundled React app.                                          |
| skipLibCheck     | Leave it as the repo already has it | It does not hide errors in the app’s JSX or theme augmentation. Turning it on is not a way to finish the upgrade.                                           |

### Compiler errors and the fix

Shapes you will see in app code after the peers move to v9. Run codemods first so this list is the remainder.

| What tsc says                                                                                      | Introduced                                  | Fix in the React app                                                                                                                                 |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Property `mt` / `p` / `bgcolor` does not exist on BoxProps, TypographyProps, StackProps, GridProps | Removed in v9, deprecated earlier           | Move them into `sx`. Same theme callbacks and breakpoints work there.                                                                                |
| Property `xs` / `item` does not exist on Grid                                                      | v7 rename, v9 deletes GridLegacy            | `<Grid size={{ xs: 12, sm: 6 }}>`. Delete `item`. `direction="column"` is also gone from the type; use Stack.                                        |
| Property `components` / `componentsProps` / `TransitionComponent` does not exist                   | Deprecated across v5–v7, removed in v9      | `slots` and `slotProps`. Autocomplete’s `renderTags` becomes `renderValue`.                                                                          |
| Cannot find module `@mui/material/styles/createTheme` or a `styles/*` declare module is ignored    | v7 exports map                              | `import { createTheme } from '@mui/material/styles'`. Augment `@mui/material/styles`, and rename `TypographyOptions` to `TypographyVariantsOptions`. |
| No exported member `Grid2` / `LoadingButton` / `Alert` from the old path                           | v6.4 and v7                                 | Grid from `@mui/material/Grid`. Button `loading` from `@mui/material`. Lab components that graduated import from `@mui/material`.                    |
| Cannot find module `@mui/styles` or `makeStyles`                                                   | Package removed from the repo in March 2025 | Rewrite those hooks to `styled` or `sx`. There is no v9 type to import.                                                                              |
| `styled(Box)` loses the component prop                                                             | v6, BoxOwnProps                             | `styled('div')` or cast the result `as typeof Box`.                                                                                                  |
| `getOptionLabel` / `isOptionEqualToValue` argument is not `string` when `freeSolo`                 | v9                                          | The option and value types include `string` when `freeSolo` is true. Widen the callback parameter.                                                   |
| `MuiTouchRipple` is not a key of Components                                                        | v9                                          | Override `.MuiTouchRipple-root` under `MuiButtonBase.styleOverrides`.                                                                                |
| InputLabel size `'normal'` is not assignable                                                       | v7                                          | `size="medium"`. The default did not change; only the explicit string did.                                                                           |
| `MuiMediaQueryList` and `StepButtonIcon` are gone                                                  | v6 and v7                                   | Use the DOM `MediaQueryList` types. Use `StepButtonProps['icon']`.                                                                                   |

### React 18 runtime pin, separate from the types

Material UI depends on `react-is@19`, which identifies elements differently. On React 18 (and 17) that mismatch throws during prop-type checks even when `tsc` is clean. Install `react-is` at the same version as `react`, and pin it with `overrides` (npm) or `resolutions` (Yarn). React 19 apps skip this. This is the one React-specific step that is not a type error.

> **TypeScript will not catch the visual breaks.** A clean `tsc` still leaves CSS gap on Grid, accordion markup, roving tabindex on Tabs and Menu, Slider pointer events, locale-formatted pagination numbers, and `palette.mode` if CSS variables are turned on. Those need a render pass in the running app. The library should leave `cssVariables` off by default so existing `theme.palette.mode` checks, which are typed and compile, keep meaning the same thing at runtime.

## Consumer impact

### Two kinds of React TypeScript consumer

**Only calls the library.** If application code never imports `@mui/material`, the public props of your components decide the blast radius. Peer installation, Emotion, and the `react-is` pin are still required. Visual diffs appear where your components pass through Grid, Accordion, Tabs, Menu, Dialog, Slider, or TablePagination.

Global CSS in the app that targets `.Mui*` class names, or a theme object the app passes into your provider, still breaks even when the JSX never mentions MUI.

**Also imports Material UI.** This is the common case, and it is a full v5 to v9 migration of the application. npm will not quietly upgrade a direct dependency from 5 to 9. If the app stays on v5 while your package peers v9, the install duplicates Material UI.

Two copies mean two Emotion caches, two theme contexts, and styles that apply to one tree and not the other. Hooks then fail if React itself is also duplicated. The release note should say: one version, hoisted, for the whole app.

### Impact by how often it shows up

| Change                               | Who feels it                                                                                                     | Severity                     |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| Peer major moves 5 to 9              | Every install. Transitive v5 dependencies need an override or they nest a second copy.                           | Blocking                     |
| System props removed                 | Almost every v5 screen that used `mt`, `mb`, `px`, `bgcolor` on Box, Stack, Typography, or Grid.                 | Blocking, mechanical         |
| Grid API and box model               | Every layout built with `item`, `xs`, or `direction="column"`. Spacing and width change even after the codemod.  | Blocking, visual             |
| slots replace components and \*Props | Apps that customized Autocomplete, Accordion, TextField, Snackbar, Dialog, Slider, or theme slots.               | High, mechanical             |
| DOM and focus behavior               | CSS, visual tests, and keyboard tests for Accordion, Tabs, Menu, Stepper, Divider, buttons.                      | High, behavioral             |
| Theme module path and palette.mode   | TypeScript theme augmentation, and any `styled()` callback that branches on mode once `cssVariables` is enabled. | High if CSS variables are on |
| react-is mismatch                    | Every React 17 or 18 app, at runtime, during prop-type checks.                                                   | Medium, one override         |
| Deep imports and @mui/styles         | Older helpers and `makeStyles` call sites. Fails at build time.                                                  | Medium, local                |
| Browser and TypeScript floors        | Safari 16 and below, Firefox ESR older than 121, TypeScript below 4.9, Node below 14.                            | Medium, environment          |

### Tooling floor consumers inherit

| Requirement                        | v5 era                                       | v9                                                                                  |
| ---------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------- |
| React                              | 17+                                          | 17, 18, or 19                                                                       |
| react-is                           | Matched React loosely                        | Package uses 19. On React 17 or 18, override `react-is` to the app’s React version. |
| TypeScript                         | 3.5 minimum at the end of v5                 | 4.9 minimum                                                                         |
| @types/react                       | Matched the React major                      | Same major as `react`, still required                                               |
| Node for the library’s own tooling | 12+                                          | 14+ since v6                                                                        |
| Emotion                            | Required peer                                | Still a required peer (`@emotion/react` ^11.5, `@emotion/styled` ^11.3)             |
| Bundler aliases                    | Often needed for ESM icons and modern builds | Remove them. The exports map is the supported entry.                                |

### MUI X, if the app has it

Upgrade Material UI and MUI X in the same change window. MUI X v9’s date pickers delete the legacy field DOM and the `enableAccessibleFieldDOMStructure` escape hatch; a custom `textField` slot that rendered a plain input crashes. Data Grid charts integration is no longer an experimental flag. Pagination labels are locale-formatted, same idea as Material UI’s TablePagination. None of that is pulled in by `@mui/material` itself. Mention it so teams do not discover it mid-upgrade.

## API differences

### v5 call site to v9 call site

These are the differences consumers will paste into reviews. Codemods cover the left column when the JSX is local and the props are written inline.

| Area                  | Written against v5                                                                           | Required on v9                                                                                                           |
| --------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Grid                  | `<Grid item xs={12} sm={6}>` and container `direction="column"`                              | `<Grid size={{ xs: 12, sm: 6 }}>`. Vertical stacks use Stack. No `item` prop. No column direction.                       |
| Spacing shortcuts     | `<Box mt={2} color="primary.main">`                                                          | `<Box sx={{ mt: 2, color: "primary.main" }}>`                                                                            |
| Inner elements        | `components`, `componentsProps`, `TransitionComponent`, `ListboxComponent`, `PaperComponent` | `slots` and `slotProps`. `renderTags` becomes `renderValue`. `getTagProps` becomes `getItemProps`.                       |
| List rows             | `<ListItem button>`                                                                          | `<ListItemButton>`                                                                                                       |
| Loading               | `import LoadingButton from "@mui/lab/LoadingButton"`                                         | `<Button loading>` from `@mui/material`. Since v6.4.                                                                     |
| Graduated Lab imports | `@mui/lab` for Alert, Autocomplete, Pagination, Rating, Skeleton, SpeedDial, ToggleButton    | Import them from `@mui/material`. Removed from Lab in v7.                                                                |
| Dialog close          | `onBackdropClick` and `disableEscapeKeyDown`                                                 | `onClose(event, reason)` and ignore reason `"backdropClick"` or `"escapeKeyDown"`.                                       |
| Hide by breakpoint    | `<Hidden mdDown>`                                                                            | `sx` display breakpoints, or `useMediaQuery`. Hidden was removed in v7.                                                  |
| Dark mode styles      | `theme.palette.mode === "dark"`                                                              | `theme.applyStyles("dark", ...)` and `theme.vars` when CSS variables are enabled.                                        |
| Theme types           | `declare module "@mui/material/styles/createTypography"`                                     | `declare module "@mui/material/styles"` and the renamed Variants interfaces.                                             |
| Theme factory         | `createMuiTheme`, `experimentalStyled`                                                       | `createTheme`, `styled`. Both aliases died in v7.                                                                        |
| JSS helpers           | `makeStyles` from `@mui/styles`                                                              | `styled` or `sx`. The styles package is unsupported.                                                                     |
| Icons                 | `InfoOutline` and the other 22 `*Outline` duplicates                                         | `InfoOutlined`. The Rounded and Sharp theme variants of those names were kept.                                           |
| Pagination label      | Raw integers                                                                                 | Locale-formatted. Pass `labelDisplayedRows` to opt out.                                                                  |
| Button element swap   | `component={Link}` or `component="div"` with no extra hint                                   | Set `nativeButton` when the rendered element changes between a native button and a non-button, so SSR hydration matches. |

### Behavior that stays source-compatible and still changes the product

| Component     | What the user or the test sees                                                                                                                                        |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accordion     | Summary is a button inside a heading. A Typography paragraph inside the summary is invalid HTML; use a span. Heading level is set with `slotProps.heading.component`. |
| Tabs and Menu | Arrow keys move DOM focus and rewrite tabindex so only one item is tabbable. A Tab outside Tabs, or a MenuItem outside Menu or MenuList, throws.                      |
| Stepper       | The root is an `ol` and each step is an `li`. With StepButton, the widget exposes tablist semantics and roving tabindex.                                              |
| ButtonBase    | Enter and Space produce a click that bubbles, and `onClick` receives a mouse event. Disabled non-native buttons do not run click or keyboard handlers.                |
| Autocomplete  | Right-click no longer toggles the listbox. `onInputChange` gained blur, selectOption, and removeOption in v6.                                                         |
| Slider        | `preventDefault` on mouse down no longer cancels a drag. Use `onPointerDown`.                                                                                         |
| Backdrop      | `aria-hidden` is not set on the root by default.                                                                                                                      |
| Divider       | `orientation="vertical"` renders a separator element, not `hr`. Selectors aimed at `hr` miss it.                                                                      |
| Chip          | Escape no longer blurs the chip.                                                                                                                                      |
| ListItemIcon  | Default min-width is 36px, down from 56px, and it uses theme spacing.                                                                                                 |

## Low-impact adoption

### How consumers take the library without rewriting the product

The cheap path is a compatibility boundary in the library, plus codemods for the code the library does not own. The expensive path is asking every app to touch every screen before they can bump the dependency.

| Step                                                                                                         | Owner    | What it protects                                                                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Publish this as a new major of the library                                                                   | Library  | Semver stays honest. Apps opt in by bumping one dependency.                                                                                                                                         |
| `peerDependencies` on `@mui/material`, `@mui/system`, `@emotion/react`, and `@emotion/styled` at v9          | Library  | One copy is hoisted. Document npm overrides / yarn resolutions for any transitive package still requesting v5.                                                                                      |
| Keep the previous library major installable, peered to Material UI v7                                        | Library  | Teams that cannot take the grid and system-prop break this quarter stay on a supported MUI line. Do not keep them on v5.                                                                            |
| Leave `cssVariables` off in the default theme                                                                | Library  | Existing `palette.mode` checks keep working. Offer a documented opt-in for apps that want CSS variables and `color-mix()`.                                                                          |
| Adapter props on components you re-export                                                                    | Library  | Accept `mt`, `p`, `componentsProps`, and Grid `xs` inside your public components, map them to `sx`, `slots`, and `size`, and warn once in development. Delete the adapters in your following major. |
| Do not wrap Pigment CSS                                                                                      | Library  | It is paused and alpha. Emotion is the path consumers already have configured, including Next.js cache providers.                                                                                   |
| Set TypeScript to 5.x and `moduleResolution` `bundler`, and keep `@types/react` on the same major as `react` | Each app | The editor reports the same missing exports Vite or webpack will refuse. Avoids a false migration caused by `@types/react` 19 on React 18.                                                          |
| Run codemods on TSX source, one major at a time, then `tsc --noEmit`                                         | Each app | MUI’s guides are v5 to v6, v6 to v7, then v7 to v9. `tsc` is the list of call sites the codemod missed. Commit between steps.                                                                       |
| `react-is` override on React 17 and 18                                                                       | Each app | Stops runtime prop-type crashes. Not needed on React 19.                                                                                                                                            |
| Grep what codemods skip                                                                                      | Each app | Spread props, props held in variables, `styleOverrides` keys, global CSS class names, and `styled()` selectors.                                                                                     |
| Visual pass on Grid, Accordion, Tabs, Menu, Dialog, Slider, TablePagination                                  | Each app | These change pixels or keyboard behavior even when TypeScript is clean.                                                                                                                             |

### Codemods, in the order MUI expects

```bash
npx @mui/codemod@latest v6.0.0/grid-v2-props <path>
npx @mui/codemod@latest v6.0.0/styled <path>
npx @mui/codemod@latest v6.0.0/sx-prop <path>
npx @mui/codemod@latest v6.0.0/theme-v6 <path>
npx @mui/codemod@latest v7.0.0/grid-props <path>
npx @mui/codemod@latest v7.0.0/lab-removed-components <path>
npx @mui/codemod@latest deprecations/all <path>
npx @mui/codemod@latest v9.0.0/system-props <path>
```

Run them on application source, never on `node_modules`. The v6 system props codemod exists too; the removal codemod is the v9 one. Add `-- --jsx=Box,Typography,Stack,Link,Grid` when an auto-import plugin hides the Material UI import from the codemod.

### Suggested release note, short enough to send

This version of the component library is built on Material UI v9 for React and TypeScript. Material UI v5 is unsupported and cannot host current MUI X. v9 keeps the same Emotion styling model. React 18 apps stay on React 18; keep `@types/react` on 18, use TypeScript 5 with `moduleResolution: "bundler"`, and pin `react-is` to the React 18 version. Run MUI’s codemods from v5 to v6 to v7 to v9, then `tsc --noEmit`. A clean compile does not cover grid spacing, accordion markup, or menu and tab focus, so check those in the running app. The previous major of this library remains available for teams that need to stay on Material UI v7 for now. CSS-variable theming and Pigment CSS are not turned on by this release.

### References

- https://mui.com/material-ui/getting-started/versions/
- https://mui.com/material-ui/getting-started/support/
- https://mui.com/material-ui/migration/upgrade-to-v6/
- https://mui.com/material-ui/migration/upgrade-to-v7/
- https://mui.com/material-ui/migration/upgrade-to-v9/
- https://mui.com/blog/material-ui-v6-is-out/
- https://mui.com/blog/material-ui-v7-is-here/
- https://mui.com/blog/introducing-material-ui-v9/
- https://mui.com/blog/introducing-mui-v9/
- https://mui.com/blog/2026-and-beyond/
- https://mui.com/x/introduction/support/
