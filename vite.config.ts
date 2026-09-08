import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

function firstNonEmpty(...values: (string | undefined)[]): string {
  for (const value of values) {
    if (value !== undefined && value.length > 0) {
      return value;
    }
  }

  return '';
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const licenseKey = firstNonEmpty(process.env.MUI_X_LICENSE_KEY, env.MUI_X_LICENSE_KEY);

  return {
    plugins: [react()],
    envPrefix: ['VITE_', 'MUI_'],
    define: {
      __MUI_X_LICENSE_KEY__: JSON.stringify(licenseKey),
    },
    build: {
      outDir: 'dist-app',
    },
  };
});
