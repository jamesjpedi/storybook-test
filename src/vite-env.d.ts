/// <reference types="vite/client" />

declare const __MUI_X_LICENSE_KEY__: string;

interface ImportMetaEnv {
  readonly MUI_X_LICENSE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
