import { prisma } from '@/app/lib/prisma';
import { verifyTenantSessionToken } from '@/app/lib/tenant-session-token';

type AccessResult =
  | { ok: true; userId: string; tenantId: string; role: string }
  | { ok: false; status: number; error: string };

function normalize(value: unknown): string {
  return String(value || '').trim();
}

export async function requireTenantRoleAccess(params: {
  tenantId: unknown;
  tenantUserId: unknown;
  tenantSessionToken?: unknown;
  allowedRoles?: string[];
}): Promise<AccessResult> {
  const tenantId = normalize(params.tenantId);
  const tenantUserId = normalize(params.tenantUserId);
  const tenantSessionToken = normalize(params.tenantSessionToken);
  const allowedRoles = params.allowedRoles && params.allowedRoles.length > 0 ? params.allowedRoles : ['ADMIN'];

  if (!tenantId) {
    return { ok: false, status: 400, error: 'tenantId requerido' };
  }

  if (!tenantUserId) {
    return { ok: false, status: 401, error: 'tenantUserId requerido' };
  }

  let session;
  try {
    session = verifyTenantSessionToken(tenantSessionToken);
  } catch {
    return { ok: false, status: 401, error: 'Sesión de negocio inválida, vuelve a iniciar sesión' };
  }

  if (session.tuid !== tenantUserId || session.tid !== tenantId) {
    return { ok: false, status: 403, error: 'Sesión fuera de alcance' };
  }

  const user = await prisma.tenantUser.findFirst({
    where: { id: tenantUserId, tenantId },
    select: { id: true, tenantId: true, role: true, tenant: { select: { isActive: true } } },
  });

  if (!user) {
    return { ok: false, status: 403, error: 'Usuario sin acceso a este negocio' };
  }

  if (user.tenant.isActive === false) {
    return { ok: false, status: 403, error: 'Negocio suspendido' };
  }

  if (!allowedRoles.includes(user.role)) {
    return { ok: false, status: 403, error: 'Permisos insuficientes' };
  }

  return { ok: true, userId: user.id, tenantId: user.tenantId, role: user.role };
}
