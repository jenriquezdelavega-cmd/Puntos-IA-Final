import { prisma } from '@/app/lib/prisma';
import crypto from 'crypto';
import { requireTenantRoleAccess } from '@/app/lib/tenant-admin-auth';
import { apiError, apiSuccess, type ApiErrorCode, getRequestId } from '@/app/lib/api-response';
import { parseJsonObject, parseWithSchema, requiredString } from '@/app/lib/request-validation';

const BUSINESS_TZ = 'America/Monterrey';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateRobustCode() {
  const parts = [4, 4, 4].map((len) => {
    let out = '';
    for (let i = 0; i < len; i++) {
      const idx = crypto.randomInt(0, ALPHABET.length);
      out += ALPHABET[idx];
    }
    return out;
  });
  return parts.join('-');
}

function dayKeyInBusinessTz(d = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);

  const get = (type: string) => parts.find((part) => part.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}


function accessStatusToCode(status: number): ApiErrorCode {
  if (status === 400) return 'BAD_REQUEST';
  if (status === 401) return 'UNAUTHORIZED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  return 'INTERNAL_ERROR';
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const body = await parseJsonObject(request);
    if (!body) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'JSON inválido',
      });
    }
    const parsedBody = parseWithSchema(body, {
      tenantId: requiredString,
      tenantUserId: requiredString,
      tenantSessionToken: requiredString,
    });
    if (!parsedBody.ok) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: `Campo inválido: ${String(parsedBody.field)}`,
      });
    }

    const { tenantId, tenantUserId, tenantSessionToken } = parsedBody.data;

    const access = await requireTenantRoleAccess({
      tenantId,
      tenantUserId,
      tenantSessionToken,
      allowedRoles: ['ADMIN', 'STAFF'],
    });

    if (!access.ok) {
      return apiError({
        requestId,
        status: access.status,
        code: accessStatusToCode(access.status),
        message: access.error,
      });
    }

    const day = dayKeyInBusinessTz();

    const existing = await prisma.dailyCode.findFirst({
      where: {
        tenantId: access.tenantId,
        generatedById: access.userId,
        day,
        isActive: true,
      },
      orderBy: { validDate: 'desc' },
    });

    if (existing) {
      return apiSuccess({ requestId, data: { code: existing.code, reused: true, day } });
    }

    const saved = await prisma.dailyCode.create({
      data: {
        code: generateRobustCode(),
        tenantId: access.tenantId,
        generatedById: access.userId,
        day,
        isActive: true,
      },
    });

    return apiSuccess({ requestId, data: { code: saved.code, reused: false, day } });
  } catch (error: unknown) {
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: (error instanceof Error ? error.message : 'Error') || 'Error interno',
    });
  }
}
