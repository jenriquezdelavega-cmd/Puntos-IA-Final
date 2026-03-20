import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { prisma } from '@/app/lib/prisma';
import { createHash } from 'node:crypto';

const MAP_TENANTS_TTL_MS = 60_000;
let cachedTenants: Array<{
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  address: string | null;
  prize: string;
  instagram: string | null;
  logoData: string | null;
}> | null = null;
let cachedTenantsExpiresAt = 0;
let cachedTenantsEtag = '';

function buildTenantsEtag(tenants: unknown) {
  return `"${createHash('sha256').update(JSON.stringify(tenants)).digest('base64url')}"`;
}

export async function GET(request: Request) {
  const requestId = getRequestId(request);

  try {
    const now = Date.now();
    if (cachedTenants && now < cachedTenantsExpiresAt) {
      const ifNoneMatch = request.headers.get('if-none-match');
      if (ifNoneMatch && cachedTenantsEtag && ifNoneMatch === cachedTenantsEtag) {
        return new Response(null, {
          status: 304,
          headers: {
            'x-request-id': requestId,
            etag: cachedTenantsEtag,
            'cache-control': 'public, s-maxage=60, stale-while-revalidate=300',
          },
        });
      }

      return apiSuccess({
        requestId,
        data: { tenants: cachedTenants },
        headers: {
          etag: cachedTenantsEtag,
          'cache-control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      });
    }

    const tenants = await prisma.tenant.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        lat: true,
        lng: true,
        address: true,
        prize: true,
        instagram: true,
        logoData: true,
      },
    });

    cachedTenants = tenants;
    cachedTenantsExpiresAt = now + MAP_TENANTS_TTL_MS;
    cachedTenantsEtag = buildTenantsEtag(tenants);

    const ifNoneMatch = request.headers.get('if-none-match');
    if (ifNoneMatch && cachedTenantsEtag && ifNoneMatch === cachedTenantsEtag) {
      return new Response(null, {
        status: 304,
        headers: {
          'x-request-id': requestId,
          etag: cachedTenantsEtag,
          'cache-control': 'public, s-maxage=60, stale-while-revalidate=300',
        },
      });
    }

    return apiSuccess({
      requestId,
      data: { tenants },
      headers: {
        etag: cachedTenantsEtag,
        'cache-control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch {
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'Error al listar negocios del mapa',
    });
  }
}
