# Getting started

`bhhc-design-system` is a drop-in replacement for MUI Material, MUI Core, and MUI X. Install this package instead of `@mui/*`. The MUI X license is injected when any entry is imported — do **not** call `LicenseInfo.setLicenseKey` in your app.

## Requirements

- React **18 or 19** (`react` and `react-dom` are peer dependencies)
- A bundler that understands ESM package `exports` (Vite, webpack 5, Next.js)

This library is developed against React 18.

## Install

```bash
npm install bhhc-design-system
```

Remove `@mui/material`, `@mui/x-*`, `@emotion/react`, `@emotion/styled`, and `@base-ui/react` from your app if they are already listed. This package depends on them so you do not install MUI twice (duplicate copies break theme and license checks).

## Wrap your app

```tsx
import { CssBaseline, ThemeProvider, theme } from 'bhhc-design-system';

export function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {/* routes */}
    </ThemeProvider>
  );
}
```

## Import paths

Subpaths match MUI package names with the `@mui/` prefix dropped. Root and `/material` are the same Material entry (with BHHC `Button`, `Card`, and `theme`).

```tsx
import { Button, TextField } from 'bhhc-design-system';
import { Button } from 'bhhc-design-system/material';
import { DataGrid, DataGridPremium } from 'bhhc-design-system/x-data-grid-premium';
import { LineChart } from 'bhhc-design-system/x-charts-premium';
import { DatePicker } from 'bhhc-design-system/x-date-pickers-pro';
```

| Import from | Re-exports |
| --- | --- |
| `bhhc-design-system` / `bhhc-design-system/material` | `@mui/material` (Button, Card, theme overridden) |
| `bhhc-design-system/icons-material` | `@mui/icons-material` |
| `bhhc-design-system/system` | `@mui/system` |
| `bhhc-design-system/utils` | `@mui/utils` |
| `bhhc-design-system/lab` | `@mui/lab` |
| `bhhc-design-system/styled-engine` | `@mui/styled-engine` |
| `bhhc-design-system/base` | `@mui/base` |
| `bhhc-design-system/base-ui` | `@base-ui/react` |
| `bhhc-design-system/x-data-grid` | `@mui/x-data-grid` |
| `bhhc-design-system/x-data-grid-pro` | `@mui/x-data-grid-pro` |
| `bhhc-design-system/x-data-grid-premium` | `@mui/x-data-grid-premium` (`DataGrid` = `DataGridPremium`) |
| `bhhc-design-system/x-date-pickers` | `@mui/x-date-pickers` |
| `bhhc-design-system/x-date-pickers-pro` | `@mui/x-date-pickers-pro` |
| `bhhc-design-system/x-charts` | `@mui/x-charts` |
| `bhhc-design-system/x-charts-pro` | `@mui/x-charts-pro` |
| `bhhc-design-system/x-charts-premium` | `@mui/x-charts-premium` |
| `bhhc-design-system/x-tree-view` | `@mui/x-tree-view` |
| `bhhc-design-system/x-tree-view-pro` | `@mui/x-tree-view-pro` |
| `bhhc-design-system/x-scheduler` | `@mui/x-scheduler` |
| `bhhc-design-system/x-scheduler-premium` | `@mui/x-scheduler-premium` |
| `bhhc-design-system/x-license` | `@mui/x-license` |

## Date pickers

Date pickers still need a date library and `LocalizationProvider` in **your** app (for example `dayjs`):

```tsx
import { AdapterDayjs } from 'bhhc-design-system/x-date-pickers-pro';
import { DatePicker, LocalizationProvider } from 'bhhc-design-system/x-date-pickers-pro';
import dayjs from 'dayjs';

<LocalizationProvider dateAdapter={AdapterDayjs}>
  <DatePicker label="Effective date" defaultValue={dayjs()} />
</LocalizationProvider>
```

Install `dayjs` (or `date-fns` / `luxon` / `moment`) in the consumer app. It is not bundled in this package.

## License

You do not configure MUI X in the consumer app. Importing any `bhhc-design-system` entry sets the license key that was inlined when this package was built.

For local Storybook and `npm run build:lib`, copy `.env.example` to `.env` and set `MUI_X_LICENSE_KEY`.

CI/CD in Azure DevOps uses the same key as a secret pipeline variable and publishes to Azure Artifacts on `v*` tags. See [README.md](README.md#azure-devops).
