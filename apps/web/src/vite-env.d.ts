/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VIDEO_UPLOAD_PROVIDER?: string;
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
