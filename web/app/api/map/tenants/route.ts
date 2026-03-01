import { apiError, apiSuccess, getRequestId } from '@/app/lib/api-response';
import { prisma } from '@/app/lib/prisma';

export async function GET(request: Request) {
  const requestId = getRequestId(request);

  try {
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

    return apiSuccess({
      requestId,
      data: { tenants },
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
