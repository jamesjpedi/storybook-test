import React from 'react';
import { CssBaseline, ThemeProvider } from '@mui/material';

import { applyMuiXLicense } from '../src/license';
import { theme } from '../src/theme';

import type { Preview } from '@storybook/react-vite';

applyMuiXLicense();

const preview: Preview = {
  decorators: [
    (Story) => (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Story />
      </ThemeProvider>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: {
        order: ['Getting started', 'How to Use', 'Components', 'Changelog'],
      },
    },
  },
};

export default preview;
