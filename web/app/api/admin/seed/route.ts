import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { parseJsonObject, parseWithSchema, requiredString } from '@/app/lib/request-validation';
import { isValidMasterPassword } from '@/app/lib/master-auth';
import { prisma } from '@/app/lib/prisma';


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
      masterPassword: requiredString,
    });
    if (!parsedBody.ok) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: `Campo inválido: ${String(parsedBody.field)}`,
      });
    }

    if (!isValidMasterPassword(parsedBody.data.masterPassword)) {
      return apiError({
        requestId,
        status: 401,
        code: 'UNAUTHORIZED',
        message: 'No autorizado',
      });
    }

    const users = [
      { name: 'Carlos Perez', gender: 'Hombre' },
      { name: 'Maria Gonzalez', gender: 'Mujer' },
      { name: 'Juan Lopez', gender: 'Hombre' },
      { name: 'Ana Torres', gender: 'Mujer' },
      { name: 'Luis Hernandez', gender: 'Hombre' },
      { name: 'Sofia Ramirez', gender: 'Mujer' },
      { name: 'Pedro Diaz', gender: 'Hombre' },
      { name: 'Lucia Fernandez', gender: 'Mujer' },
      { name: 'Miguel Ruiz', gender: 'Hombre' },
      { name: 'Elena Gomez', gender: 'Mujer' },
      { name: 'Alex Morgan', gender: 'Otro' },
      { name: 'Fernando Solis', gender: 'Hombre' },
    ];

    for (const user of users) {
      const randomPhone = `55${Math.floor(Math.random() * 100000000)}`;

      await prisma.user.create({
        data: {
          name: user.name,
          phone: randomPhone,
          password: '123',
          gender: user.gender,
          birthDate: new Date('1995-01-01T12:00:00Z'),
        },
      });
    }

    return apiSuccess({
      requestId,
      data: {
        seededCount: users.length,
        message: `¡${users.length} usuarios inyectados!`,
      },
    });
  } catch {
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: 'Error interno al inyectar usuarios de prueba',
    });
  }
}
