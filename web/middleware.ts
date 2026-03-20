import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { buildRateLimitKey, checkRateLimit } from '@/app/lib/rate-limit';

function resolveRequestId(request: NextRequest) {
  const fromHeader = request.headers.get('x-request-id')?.trim();
  return fromHeader || crypto.randomUUID();
}

function applySecurityHeaders(headers: Headers) {
  headers.set('x-content-type-options', 'nosniff');
  headers.set('x-frame-options', 'DENY');
  headers.set('referrer-policy', 'strict-origin-when-cross-origin');
  headers.set('permissions-policy', 'camera=(), microphone=(), geolocation=()');
  headers.set('x-dns-prefetch-control', 'off');
  headers.set('x-permitted-cross-domain-policies', 'none');
}

export function middleware(request: NextRequest) {
  const requestId = resolveRequestId(request);

  if (request.nextUrl.pathname.startsWith('/api/master/')) {
    const rateLimit = checkRateLimit({
      key: buildRateLimitKey('master-api', request),
      limit: 60,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      const headers = new Headers({
        'x-request-id': requestId,
        'retry-after': String(rateLimit.retryAfterSeconds),
        'cache-control': 'private, no-store, max-age=0',
      });
      applySecurityHeaders(headers);

      return NextResponse.json(
        {
          ok: false,
          code: 'FORBIDDEN',
          message: `Demasiados intentos. Intenta de nuevo en ${rateLimit.retryAfterSeconds}s`,
        },
        {
          status: 429,
          headers,
        },
      );
    }
  }

  const requestHeaders = new Headers(request.headers);

  requestHeaders.set('x-request-id', requestId);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.headers.set('x-request-id', requestId);
  applySecurityHeaders(response.headers);

  if (
    request.nextUrl.pathname.startsWith('/api/user/') ||
    request.nextUrl.pathname.startsWith('/api/tenant/') ||
    request.nextUrl.pathname.startsWith('/api/master/')
  ) {
    response.headers.set('cache-control', 'private, no-store, max-age=0');
  }

  return response;
}

export const config = {
  matcher: ['/api/:path*'],
};
