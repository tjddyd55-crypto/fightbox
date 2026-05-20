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
          code: 'INTERNAL_ERROR',
          message: error.message,
        },
      },
    };
  }

  return {
    status: 500,
    body: {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Unexpected server error',
      },
    },
  };
}
