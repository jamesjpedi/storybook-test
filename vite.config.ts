import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const licenseKey = process.env.MUI_X_LICENSE_KEY || env.MUI_X_LICENSE_KEY || '';

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
