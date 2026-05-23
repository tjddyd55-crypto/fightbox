import type { Request } from 'express';

export function resolveFrontendPublicUrl(req?: Request): string {
  const configured = process.env.FRONTEND_PUBLIC_URL?.trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }

  const origin = req?.get('origin')?.trim();
  if (origin) {
    return origin.replace(/\/$/, '');
  }

  return '';
}

export function buildProgramShareUrl(shareToken: string, req?: Request): string {
  const base = resolveFrontendPublicUrl(req);
  const path = `/share/programs/${encodeURIComponent(shareToken)}`;
  return base ? `${base}${path}` : path;
}
