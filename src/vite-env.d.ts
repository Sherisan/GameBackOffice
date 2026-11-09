/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API origin for builds (e.g. https://api.example.com). Empty in dev — Vite proxies /api. */
  readonly VITE_API_BASE?: string;
}
