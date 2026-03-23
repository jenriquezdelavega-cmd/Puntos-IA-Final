import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';

export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'TOO_MANY_REQUESTS'
  | 'GONE'
  | 'INTERNAL_ERROR';

export function getRequestId(request: Request) {
  const headerRequestId = request.headers.get('x-request-id');
  if (headerRequestId && headerRequestId.trim()) {
    return headerRequestId.trim();
  }
  return randomUUID();
}

export function apiError(params: {
  requestId: string;
  status: number;
  code: ApiErrorCode;
  message: string;
  details?: unknown;
  headers?: HeadersInit;
}) {
  const { requestId, status, code, message, details, headers } = params;

  return NextResponse.json(
    {
      ok: false,
      requestId,
      code,
      message,
      details,
      error: message,
    },
    {
      status,
      headers: {
        'x-request-id': requestId,
        ...(headers || {}),
      },
    },
  );
}

export function apiSuccess<T>(params: {
  requestId: string;
  data: T;
  status?: number;
  headers?: HeadersInit;
}) {
  const { requestId, data, status = 200, headers } = params;

  return NextResponse.json(
    {
      ok: true,
      requestId,
      ...data,
    },
    {
      status,
      headers: {
        'x-request-id': requestId,
        ...(headers || {}),
      },
    },
  );
}
