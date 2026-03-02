// vite-env.d.ts (or similar file)
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly PORT: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
