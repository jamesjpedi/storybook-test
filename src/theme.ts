import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: {
      main: '#3b5bdb',
      dark: '#364fc7',
    },
    text: {
      primary: '#212529',
      secondary: '#495057',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
        MuiButton: {
          defaultProps: {
            disableElevation: true,
            variant: 'contained',
          },
      styleOverrides: {
        root: {
          fontWeight: 600,
          textTransform: 'none',
        },
        sizeSmall: {
          padding: '6px 12px',
          fontSize: 12,
        },
        sizeMedium: {
          padding: '8px 16px',
          fontSize: 14,
        },
        sizeLarge: {
          padding: '12px 20px',
          fontSize: 16,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid #e9ecef',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
        },
      },
    },
  },
});
