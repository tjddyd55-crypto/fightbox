export type AuthProvider = 'api' | 'demo';

export function getAuthProvider(): AuthProvider {
  const raw = import.meta.env.VITE_AUTH_PROVIDER?.trim();
  if (raw === 'demo') {
    return 'demo';
  }
  return 'api';
}

export function isApiAuthEnabled(): boolean {
  return getAuthProvider() === 'api';
}
