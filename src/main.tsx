import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './app';
import { applyMuiXLicense } from './license';

import './app/index.css';

applyMuiXLicense();

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root was not found.');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
