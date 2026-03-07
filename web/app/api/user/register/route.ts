import { prisma } from '@/app/lib/prisma';
import { hashPassword } from '@/app/lib/password';
import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import {
  asTrimmedString,
  buildPhoneLookupCandidates,
  isStrongEnoughPassword,
  isValidPhone,
  normalizeGender,
  normalizePhone,
  parseBirthDate,
  parseJsonObject,
  parseWithSchema,
  requiredString,
} from '@/app/lib/request-validation';


export async function POST(request: Request) {
  const requestId = getRequestId(request);

  try {
    const body = await parseJsonObject(request);
    if (!body) {
      return apiError({ requestId, status: 400, code: 'BAD_REQUEST', message: 'JSON inválido' });
    }
    const parsedBody = parseWithSchema(body, {
      name: requiredString,
      phone: requiredString,
      password: requiredString,
    });
    if (!parsedBody.ok) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: `Campo inválido: ${String(parsedBody.field)}`,
      });
    }

    const { name, phone, password } = parsedBody.data;
    const email = asTrimmedString(body.email);

    if (!isValidPhone(phone)) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'Formato de teléfono inválido',
      });
    }

    const normalizedPhone = normalizePhone(phone);
    const phoneCandidates = buildPhoneLookupCandidates(phone);
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          {
            phone: {
              in: phoneCandidates,
            },
          },
          ...(normalizedPhone
            ? [
                {
                  phone: {
                    endsWith: normalizedPhone,
                  },
                },
              ]
            : []),
        ],
      },
      select: { id: true },
    });
    if (existingUser) {
      return apiError({
        requestId,
        status: 409,
        code: 'CONFLICT',
        message: 'Teléfono ya registrado',
      });
    }

    if (!isStrongEnoughPassword(password)) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'La contraseña debe tener al menos 6 caracteres',
      });
    }

    const cleanGender = normalizeGender(body.gender);
    const finalDate = parseBirthDate(body.birthDate);

    const newUser = await prisma.user.create({
      data: {
        name,
        phone: normalizedPhone || phone,
        email: email || null,
        password: hashPassword(password),
        gender: cleanGender,
        birthDate: finalDate,
      },
    });

    return apiSuccess({ requestId, data: { id: newUser.id, name: newUser.name } });
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'P2002') {
      return apiError({
        requestId,
        status: 409,
        code: 'CONFLICT',
        message: 'Teléfono ya registrado',
      });
    }

    const message =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message?: string }).message || 'Error interno')
        : 'Error interno';

    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message,
    });
  }
}
