/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DECI_API_HOST?: string;
  readonly VITE_DECI_API_TOKEN?: string;
  readonly VITE_DECI_API_TENANCY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
