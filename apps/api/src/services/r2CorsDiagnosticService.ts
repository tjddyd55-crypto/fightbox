import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { lookup } from 'node:dns/promises';
import type { IncomingHttpHeaders } from 'node:http';
import https from 'node:https';
import tls from 'node:tls';
import {
  getR2Config,
  resolvePresignUrlStyle,
  type R2Config,
  type R2PresignUrlStyle,
} from '../config/r2Config.js';
import { ApiError } from '../utils/apiError.js';
import { createPresignedVideoUpload } from './r2PresignService.js';

const DIAGNOSTIC_FILE_NAME = 'r2-cors-diagnostic.mp4';
const DIAGNOSTIC_FILE_SIZE_BYTES = 1;
const DIAGNOSTIC_CONTENT_TYPE = 'video/mp4';
const PREFLIGHT_TIMEOUT_MS = 10_000;
const CONNECTIVITY_TIMEOUT_MS = 5_000;

const SAFE_RESPONSE_HEADERS = [
  'access-control-allow-origin',
  'access-control-allow-methods',
  'access-control-allow-headers',
  'access-control-expose-headers',
  'access-control-max-age',
] as const;

const SAFE_HTTPS_HEADERS = [
  'content-type',
  'content-length',
  'date',
  'server',
  'cf-ray',
  'x-amz-request-id',
] as const;

type SafeCorsHeaderName = (typeof SAFE_RESPONSE_HEADERS)[number];
type SafeHttpsHeaderName = (typeof SAFE_HTTPS_HEADERS)[number];

export interface R2DiagnosticError {
  name: string;
  message: string;
  code?: string;
  errno?: string | number;
  syscall?: string;
  host?: string;
  port?: string | number;
  cause?: R2DiagnosticError;
}

export interface R2CorsDiagnosticTestResult {
  ok: boolean;
  status?: number;
  headers?: Partial<Record<SafeCorsHeaderName, string>>;
  error?: R2DiagnosticError;
}

export interface R2DnsDiagnosticResult {
  ok: boolean;
  address?: string;
  family?: number;
  error?: R2DiagnosticError;
}

export interface R2TlsDiagnosticResult {
  connected: boolean;
  authorized?: boolean;
  authorizationError?: string;
  protocol?: string;
  cipher?: {
    name?: string;
    version?: string;
  };
  servername: string;
  error?: R2DiagnosticError;
}

export interface R2HttpsRootDiagnosticResult {
  ok: boolean;
  status?: number;
  headers?: Partial<Record<SafeHttpsHeaderName, string>>;
  error?: R2DiagnosticError;
}

export interface R2S3HeadBucketDiagnosticResult {
  ok: boolean;
  bucketName: string;
  httpStatusCode?: number;
  error?: R2DiagnosticError & {
    code?: string;
    httpStatusCode?: number;
  };
}

export interface R2CorsDiagnosticResult {
  enabled: true;
  origin: string;
  r2: {
    endpointOrigin: string;
    bucketName: string;
    urlStyle: R2PresignUrlStyle;
  };
  connectivity: {
    dns: R2DnsDiagnosticResult;
    tls: R2TlsDiagnosticResult;
    httpsRoot: R2HttpsRootDiagnosticResult;
    s3HeadBucket: R2S3HeadBucketDiagnosticResult;
  };
  cors: {
    safeTarget: string;
    withoutRequestHeaders: R2CorsDiagnosticTestResult;
    withContentTypeRequestHeader: R2CorsDiagnosticTestResult;
  };
}

type UnknownRecord = Record<string, unknown>;

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

function toUnknownRecord(value: unknown): UnknownRecord | undefined {
  if (value && typeof value === 'object') {
    return value as UnknownRecord;
  }
  return undefined;
}

function getStringField(record: UnknownRecord, key: string): string | undefined {
  const value = record[key];
  return typeof value === 'string' ? value : undefined;
}

function getStringOrNumberField(record: UnknownRecord, key: string): string | number | undefined {
  const value = record[key];
  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }
  return undefined;
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

function collectSafeHttpsHeaders(
  headers: IncomingHttpHeaders,
): Partial<Record<SafeHttpsHeaderName, string>> {
  const safeHeaders: Partial<Record<SafeHttpsHeaderName, string>> = {};

  for (const headerName of SAFE_HTTPS_HEADERS) {
    const value = headers[headerName];
    if (Array.isArray(value)) {
      safeHeaders[headerName] = value.join(', ');
    } else if (value) {
      safeHeaders[headerName] = value;
    }
  }

  return safeHeaders;
}

function toDiagnosticError(error: unknown): R2DiagnosticError {
  if (error instanceof Error) {
    const record = toUnknownRecord(error);
    const cause = record ? record.cause : undefined;

    return {
      name: error.name,
      message: error.message,
      ...(record && getStringField(record, 'code') ? { code: getStringField(record, 'code') } : {}),
      ...(record && getStringOrNumberField(record, 'errno')
        ? { errno: getStringOrNumberField(record, 'errno') }
        : {}),
      ...(record && getStringField(record, 'syscall')
        ? { syscall: getStringField(record, 'syscall') }
        : {}),
      ...(record && getStringField(record, 'host') ? { host: getStringField(record, 'host') } : {}),
      ...(record && getStringOrNumberField(record, 'port')
        ? { port: getStringOrNumberField(record, 'port') }
        : {}),
      ...(cause ? { cause: toDiagnosticError(cause) } : {}),
    };
  }

  return {
    name: 'UnknownError',
    message: 'Unknown error',
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
      error: toDiagnosticError(error),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function runDnsLookup(hostname: string): Promise<R2DnsDiagnosticResult> {
  try {
    const result = await lookup(hostname);
    return {
      ok: true,
      address: result.address,
      family: result.family,
    };
  } catch (error) {
    return {
      ok: false,
      error: toDiagnosticError(error),
    };
  }
}

function runTlsHandshake(hostname: string): Promise<R2TlsDiagnosticResult> {
  return new Promise((resolve) => {
    let settled = false;
    const socket = tls.connect({
      host: hostname,
      port: 443,
      servername: hostname,
      timeout: CONNECTIVITY_TIMEOUT_MS,
    });

    const finish = (result: R2TlsDiagnosticResult): void => {
      if (settled) {
        return;
      }
      settled = true;
      socket.destroy();
      resolve(result);
    };

    socket.once('secureConnect', () => {
      const cipher = socket.getCipher();
      finish({
        connected: true,
        authorized: socket.authorized,
        authorizationError: socket.authorizationError
          ? String(socket.authorizationError)
          : undefined,
        protocol: socket.getProtocol() ?? undefined,
        cipher: {
          name: cipher.name,
          version: cipher.version,
        },
        servername: hostname,
      });
    });

    socket.once('timeout', () => {
      finish({
        connected: false,
        servername: hostname,
        error: {
          name: 'TimeoutError',
          message: `TLS handshake timed out after ${CONNECTIVITY_TIMEOUT_MS}ms`,
        },
      });
    });

    socket.once('error', (error) => {
      finish({
        connected: false,
        servername: hostname,
        error: toDiagnosticError(error),
      });
    });
  });
}

function runHttpsRootRequest(endpointOrigin: string): Promise<R2HttpsRootDiagnosticResult> {
  return new Promise((resolve) => {
    const request = https.request(endpointOrigin, { method: 'HEAD', timeout: CONNECTIVITY_TIMEOUT_MS }, (response) => {
      response.resume();
      resolve({
        ok: Boolean(response.statusCode && response.statusCode >= 200 && response.statusCode < 400),
        status: response.statusCode,
        headers: collectSafeHttpsHeaders(response.headers),
      });
    });

    request.once('timeout', () => {
      request.destroy(new Error(`HTTPS HEAD timed out after ${CONNECTIVITY_TIMEOUT_MS}ms`));
    });

    request.once('error', (error) => {
      resolve({
        ok: false,
        error: toDiagnosticError(error),
      });
    });

    request.end();
  });
}

async function runS3HeadBucket(config: R2Config, urlStyle: R2PresignUrlStyle): Promise<R2S3HeadBucketDiagnosticResult> {
  const client = new S3Client({
    region: 'auto',
    endpoint: config.endpoint,
    forcePathStyle: urlStyle === 'path',
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  try {
    const response = await client.send(new HeadBucketCommand({ Bucket: config.bucketName }));
    return {
      ok: true,
      bucketName: config.bucketName,
      httpStatusCode: response.$metadata.httpStatusCode,
    };
  } catch (error) {
    const record = toUnknownRecord(error);
    const metadata = toUnknownRecord(record?.$metadata);
    const baseError = toDiagnosticError(error);

    return {
      ok: false,
      bucketName: config.bucketName,
      httpStatusCode: getStringOrNumberField(metadata ?? {}, 'httpStatusCode') as number | undefined,
      error: {
        ...baseError,
        ...(getStringField(record ?? {}, 'Code') ? { code: getStringField(record ?? {}, 'Code') } : {}),
        ...(typeof metadata?.httpStatusCode === 'number'
          ? { httpStatusCode: metadata.httpStatusCode }
          : {}),
      },
    };
  }
}

export async function diagnoseR2Cors(): Promise<R2CorsDiagnosticResult> {
  const origin = getFrontendOrigin();
  const config = getR2Config();
  const urlStyle = resolvePresignUrlStyle();
  const endpoint = new URL(config.endpoint);
  const presigned = await createPresignedVideoUpload({
    fileName: DIAGNOSTIC_FILE_NAME,
    fileSize: DIAGNOSTIC_FILE_SIZE_BYTES,
    contentType: DIAGNOSTIC_CONTENT_TYPE,
    gymId: 'diagnostics',
    uploaderId: 'api',
  });

  const [
    dns,
    tlsResult,
    httpsRoot,
    s3HeadBucket,
    withoutRequestHeaders,
    withContentTypeRequestHeader,
  ] = await Promise.all([
    runDnsLookup(endpoint.hostname),
    runTlsHandshake(endpoint.hostname),
    runHttpsRootRequest(endpoint.origin),
    runS3HeadBucket(config, urlStyle),
    runPreflightTest(presigned.uploadUrl, origin),
    runPreflightTest(presigned.uploadUrl, origin, 'content-type'),
  ]);

  return {
    enabled: true,
    origin,
    r2: {
      endpointOrigin: endpoint.origin,
      bucketName: config.bucketName,
      urlStyle,
    },
    connectivity: {
      dns,
      tls: tlsResult,
      httpsRoot,
      s3HeadBucket,
    },
    cors: {
      safeTarget: buildSafeTarget(presigned.uploadUrl),
      withoutRequestHeaders,
      withContentTypeRequestHeader,
    },
  };
}
