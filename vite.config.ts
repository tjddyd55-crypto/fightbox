import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const previewPort = Number(process.env.PORT) || 4173;
const railwayAllowedHost = process.env.RAILWAY_PUBLIC_DOMAIN;
const previewAllowedHosts = [
  'app-production-6692.up.railway.app',
  railwayAllowedHost,
].filter(Boolean) as string[];

export default defineConfig({
  plugins: [react()],
  preview: {
    host: '0.0.0.0',
    port: previewPort,
    strictPort: true,
    allowedHosts: previewAllowedHosts,
  },
});
