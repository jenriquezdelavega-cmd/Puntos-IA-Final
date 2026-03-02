import { apiError, getRequestId } from '@/app/lib/api-response';
import { defaultTenantWalletStyle, getTenantWalletStyle } from '@/app/lib/tenant-wallet-style';
import { prisma } from '@/app/lib/prisma';
import { asTrimmedString } from '@/app/lib/request-validation';

export const runtime = 'nodejs';

function decodeImageData(imageData: string) {
  const raw = asTrimmedString(imageData);
  if (!raw) return null;

  const dataUrlMatch = raw.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (dataUrlMatch) {
    const mimeType = String(dataUrlMatch[1] || '').toLowerCase();
    const base64Payload = String(dataUrlMatch[2] || '');

    if (!mimeType.startsWith('image/')) return null;

    try {
      const data = Buffer.from(base64Payload, 'base64');
      if (!data.length) return null;
      return { mimeType, data };
    } catch {
      return null;
    }
  }

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return null;
  }

  try {
    const compact = raw.replace(/\s+/g, '');
    const data = Buffer.from(compact, 'base64');
    if (!data.length) return null;
    return { mimeType: 'image/png', data };
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const requestId = getRequestId(req);

  try {
    const url = new URL(req.url);
    const businessId = asTrimmedString(url.searchParams.get('businessId'));
    const kind = asTrimmedString(url.searchParams.get('kind'));

    if (!businessId || (kind !== 'logo' && kind !== 'strip')) {
      return apiError({
        requestId,
        status: 400,
        code: 'BAD_REQUEST',
        message: 'businessId y kind (logo|strip) son requeridos',
      });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: businessId },
      select: { id: true, logoData: true },
    });

    if (!tenant) {
      return apiError({
        requestId,
        status: 404,
        code: 'NOT_FOUND',
        message: 'Negocio no encontrado',
      });
    }

    const walletStyle = (await getTenantWalletStyle(tenant.id)) || defaultTenantWalletStyle(tenant.id);
    const source = kind === 'logo' ? (tenant.logoData || walletStyle.stripImageData) : walletStyle.stripImageData;
    const decoded = decodeImageData(source || '');

    if (!decoded) {
      return apiError({
        requestId,
        status: 404,
        code: 'NOT_FOUND',
        message: 'Imagen no disponible para Google Wallet',
      });
    }

    return new Response(decoded.data, {
      status: 200,
      headers: {
        'Content-Type': decoded.mimeType,
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (error: unknown) {
    return apiError({
      requestId,
      status: 500,
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Error interno',
    });
  }
}
