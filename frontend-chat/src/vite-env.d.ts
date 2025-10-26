/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FEATURE_CHESSOPS_DASHBOARD?: string;
  // Add other env variables here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

