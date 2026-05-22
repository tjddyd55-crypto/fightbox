export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

export interface ErrorResponseBody {
  error: {
    code: string;
    message: string;
  };
}

function isProductionNodeEnv(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function toErrorResponse(error: unknown): { status: number; body: ErrorResponseBody } {
  if (error instanceof ApiError) {
    return {
      status: error.status,
      body: {
        error: {
          code: error.code,
          message: error.message,
        },
      },
    };
  }

  if (error instanceof Error) {
    return {
      status: 500,
      body: {
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: isProductionNodeEnv() ? 'Internal server error' : error.message,
        },
      },
    };
  }

  return {
    status: 500,
    body: {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
      },
    },
  };
}
