import { prisma } from '@/app/lib/prisma';
import { isValidMasterCredentials } from '@/app/lib/master-auth';
import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { asTrimmedString, optionalString, parseJsonObject, parseWithSchema, requiredString } from '@/app/lib/request-validation';

const SEEDED_NAMES = [
  'Carlos Perez',
  'Maria Gonzalez',
  'Juan Lopez',
  'Ana Torres',
  'Luis Hernandez',
  'Sofia Ramirez',
  'Pedro Diaz',
  'Lucia Fernandez',
  'Miguel Ruiz',
  'Elena Gomez',
  'Alex Morgan',
  'Fernando Solis',
] as const;

function parseOptionalBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') return value;
  const raw = asTrimmedString(value).toLowerCase();
  if (!raw) return undefined;
  if (['1', 'true', 'yes', 'si', 'sí'].includes(raw)) return true;
  if (['0', 'false', 'no'].includes(raw)) return false;
  return undefined;
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const body = await parseJsonObject(request);
    if (!body) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'JSON inválido' });
    }

    const parsedBody = parseWithSchema(body, {
      masterUsername: requiredString,
      masterPassword: requiredString,
      masterOtp: optionalString,
      dryRun: parseOptionalBoolean,
    });
    if (!parsedBody.ok) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: `Campo inválido: ${String(parsedBody.field)}`,
      });
    }

    const { masterUsername, masterPassword, masterOtp, dryRun } = parsedBody.data;

    if (!isValidMasterCredentials(masterUsername, masterPassword, masterOtp)) {
      return apiError({ requestId, status: 401, code: 'UNAUTHORIZED', message: 'No autorizado' });
    }

    const seededUsers = await prisma.user.findMany({
      where: {
        name: { in: [...SEEDED_NAMES] },
        phone: { startsWith: '55' },
        birthDate: new Date('1995-01-01T12:00:00Z'),
      },
      select: {
        id: true,
        name: true,
        phone: true,
        createdAt: true,
        _count: {
          select: {
            memberships: true,
            redemptions: true,
            passwordResetTokens: true,
            challengeProgress: true,
            coalitionRewardUnlocks: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    const safeToDelete = seededUsers.filter(
      (user) =>
        user._count.memberships === 0 &&
        user._count.redemptions === 0 &&
        user._count.passwordResetTokens === 0 &&
        user._count.challengeProgress === 0 &&
        user._count.coalitionRewardUnlocks === 0,
    );

    if (dryRun !== false) {
      return apiSuccess({
        requestId,
        data: {
          dryRun: true,
          detected: seededUsers.length,
          deletable: safeToDelete.length,
          users: safeToDelete,
          message: 'Simulación completada. Envía dryRun=false para ejecutar el borrado seguro.',
        },
      });
    }

    const ids = safeToDelete.map((user) => user.id);
    if (ids.length === 0) {
      return apiSuccess({
        requestId,
        data: {
          dryRun: false,
          deleted: 0,
          message: 'No se encontraron usuarios semilla sin actividad para eliminar.',
        },
      });
    }

    const result = await prisma.user.deleteMany({
      where: { id: { in: ids } },
    });

    return apiSuccess({
      requestId,
      data: {
        dryRun: false,
        detected: seededUsers.length,
        deletable: ids.length,
        deleted: result.count,
        message: 'Usuarios semilla eliminados correctamente.',
      },
    });
  } catch (error: unknown) {
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Error interno al depurar usuarios de prueba',
    });
  }
}
