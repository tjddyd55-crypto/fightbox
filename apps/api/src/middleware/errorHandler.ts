import type { ErrorRequestHandler, RequestHandler } from 'express';
import { toErrorResponse } from '../utils/apiError.js';

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Not found',
    },
  });
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error('[fightbox-api] unhandled error', err);
  }

  const { status, body } = toErrorResponse(err);

  if (res.headersSent) {
    return;
  }

  res.status(status).json(body);
};
