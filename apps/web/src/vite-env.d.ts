/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VIDEO_UPLOAD_PROVIDER?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_R2_UPLOAD_INCLUDE_CONTENT_TYPE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
