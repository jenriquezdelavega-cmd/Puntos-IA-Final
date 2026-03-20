import { prisma } from '@/app/lib/prisma';
import { isValidMasterCredentials } from '@/app/lib/master-auth';
import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import {
  asTrimmedString,
  buildPhoneLookupCandidates,
  optionalString,
  parseJsonObject,
  parseWithSchema,
  requiredString,
} from '@/app/lib/request-validation';

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

function parseCleanupType(value: unknown): 'seeded' | 'orphan' | undefined {
  const raw = asTrimmedString(value).toLowerCase();
  if (!raw) return undefined;
  if (raw === 'seeded' || raw === 'orphan') return raw;
  return undefined;
}

function parsePhoneList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => asTrimmedString(item))
      .filter((item) => item.length > 0);
  }

  const raw = asTrimmedString(value);
  if (!raw) return [];
  return raw
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
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
      cleanupType: parseCleanupType,
      keepPhones: parsePhoneList,
    });
    if (!parsedBody.ok) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: `Campo inválido: ${String(parsedBody.field)}`,
      });
    }

    const { masterUsername, masterPassword, masterOtp, dryRun, cleanupType, keepPhones } = parsedBody.data;

    if (!isValidMasterCredentials(masterUsername, masterPassword, masterOtp)) {
      return apiError({ requestId, status: 401, code: 'UNAUTHORIZED', message: 'No autorizado' });
    }

    const normalizedKeepPhones = new Set(
      keepPhones
        .flatMap((phone) => buildPhoneLookupCandidates(phone))
        .map((phone) => asTrimmedString(phone)),
    );
    const mode = cleanupType ?? 'seeded';

    const candidateUsers = await prisma.user.findMany({
      where: {
        ...(mode === 'seeded'
          ? {
              name: { in: [...SEEDED_NAMES] },
              phone: { startsWith: '55' },
              birthDate: new Date('1995-01-01T12:00:00Z'),
            }
          : {}),
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
      take: mode === 'seeded' ? 1000 : 10000,
    });

    const safeToDelete = candidateUsers.filter(
      (user) =>
        user._count.memberships === 0 &&
        user._count.redemptions === 0 &&
        user._count.passwordResetTokens === 0 &&
        user._count.challengeProgress === 0 &&
        user._count.coalitionRewardUnlocks === 0 &&
        !normalizedKeepPhones.has(asTrimmedString(user.phone)),
    );

    if (dryRun !== false) {
      return apiSuccess({
        requestId,
        data: {
          dryRun: true,
          cleanupType: mode,
          detected: candidateUsers.length,
          deletable: safeToDelete.length,
          keptByPhone: candidateUsers.length - safeToDelete.length,
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
          cleanupType: mode,
          deleted: 0,
          message: mode === 'seeded'
            ? 'No se encontraron usuarios semilla sin actividad para eliminar.'
            : 'No se encontraron usuarios huérfanos sin actividad para eliminar.',
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
        cleanupType: mode,
        detected: candidateUsers.length,
        deletable: ids.length,
        deleted: result.count,
        message: mode === 'seeded'
          ? 'Usuarios semilla eliminados correctamente.'
          : 'Usuarios huérfanos eliminados correctamente.',
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
