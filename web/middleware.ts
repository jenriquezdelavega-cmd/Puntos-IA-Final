import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function resolveRequestId(request: NextRequest) {
  const fromHeader = request.headers.get('x-request-id')?.trim();
  return fromHeader || crypto.randomUUID();
}

export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const requestId = resolveRequestId(request);

  requestHeaders.set('x-request-id', requestId);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set('x-request-id', requestId);
  response.headers.set('x-content-type-options', 'nosniff');

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
