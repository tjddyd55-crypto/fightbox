import { resolvePresignUrlStyle, type R2PresignUrlStyle } from '../config/r2Config.js';
import { ApiError } from '../utils/apiError.js';
import { createPresignedVideoUpload } from './r2PresignService.js';

const DIAGNOSTIC_FILE_NAME = 'r2-cors-diagnostic.mp4';
const DIAGNOSTIC_FILE_SIZE_BYTES = 1;
const DIAGNOSTIC_CONTENT_TYPE = 'video/mp4';
const PREFLIGHT_TIMEOUT_MS = 10_000;

const SAFE_RESPONSE_HEADERS = [
  'access-control-allow-origin',
  'access-control-allow-methods',
  'access-control-allow-headers',
  'access-control-expose-headers',
  'access-control-max-age',
] as const;

type SafeCorsHeaderName = (typeof SAFE_RESPONSE_HEADERS)[number];

export interface R2CorsDiagnosticFetchError {
  name: string;
  message: string;
}

export interface R2CorsDiagnosticTestResult {
  ok: boolean;
  status?: number;
  headers?: Partial<Record<SafeCorsHeaderName, string>>;
  error?: R2CorsDiagnosticFetchError;
}

export interface R2CorsDiagnosticResult {
  enabled: true;
  origin: string;
  safeTarget: string;
  urlStyle: R2PresignUrlStyle;
  tests: {
    withoutRequestHeaders: R2CorsDiagnosticTestResult;
    withContentTypeRequestHeader: R2CorsDiagnosticTestResult;
  };
}

function getFrontendOrigin(): string {
  const origin = process.env.FRONTEND_ORIGIN?.trim();
  if (!origin) {
    throw new ApiError(503, 'R2_DIAGNOSTICS_NOT_CONFIGURED', 'FRONTEND_ORIGIN is required');
  }
  return origin;
}

function buildSafeTarget(uploadUrl: string): string {
  const url = new URL(uploadUrl);
  return `${url.origin}${url.pathname}`;
}

function collectSafeCorsHeaders(headers: Headers): Partial<Record<SafeCorsHeaderName, string>> {
  const safeHeaders: Partial<Record<SafeCorsHeaderName, string>> = {};

  for (const headerName of SAFE_RESPONSE_HEADERS) {
    const value = headers.get(headerName);
    if (value) {
      safeHeaders[headerName] = value;
    }
  }

  return safeHeaders;
}

function toFetchError(error: unknown): R2CorsDiagnosticFetchError {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
    };
  }

  return {
    name: 'UnknownError',
    message: 'Unknown fetch error',
  };
}

async function runPreflightTest(
  uploadUrl: string,
  origin: string,
  requestHeaders?: string,
): Promise<R2CorsDiagnosticTestResult> {
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), PREFLIGHT_TIMEOUT_MS);

  try {
    const headers: Record<string, string> = {
      Origin: origin,
      'Access-Control-Request-Method': 'PUT',
    };

    if (requestHeaders) {
      headers['Access-Control-Request-Headers'] = requestHeaders;
    }

    const response = await fetch(uploadUrl, {
      method: 'OPTIONS',
      headers,
      signal: abortController.signal,
    });

    return {
      ok: response.ok,
      status: response.status,
      headers: collectSafeCorsHeaders(response.headers),
    };
  } catch (error) {
    return {
      ok: false,
      error: toFetchError(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function diagnoseR2Cors(): Promise<R2CorsDiagnosticResult> {
  const origin = getFrontendOrigin();
  const urlStyle = resolvePresignUrlStyle();
  const presigned = await createPresignedVideoUpload({
    fileName: DIAGNOSTIC_FILE_NAME,
    fileSize: DIAGNOSTIC_FILE_SIZE_BYTES,
    contentType: DIAGNOSTIC_CONTENT_TYPE,
    gymId: 'diagnostics',
    uploaderId: 'api',
  });

  const [withoutRequestHeaders, withContentTypeRequestHeader] = await Promise.all([
    runPreflightTest(presigned.uploadUrl, origin),
    runPreflightTest(presigned.uploadUrl, origin, 'content-type'),
  ]);

  return {
    enabled: true,
    origin,
    safeTarget: buildSafeTarget(presigned.uploadUrl),
    urlStyle,
    tests: {
      withoutRequestHeaders,
      withContentTypeRequestHeader,
    },
  };
}
