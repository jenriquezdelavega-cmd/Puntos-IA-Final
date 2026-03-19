import { prisma } from '@/app/lib/prisma';
import { asTrimmedString } from '@/app/lib/request-validation';
import { defaultTenantWalletStyle, getTenantWalletStyle } from '@/app/lib/tenant-wallet-style';
import { generateDynamicStripResponse } from '@/app/lib/dynamic-strip';
import { isWalletAssetVersioningEnabled } from '@/app/lib/wallet-asset-versioning';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = asTrimmedString(searchParams.get('customerId'));
    const businessId = asTrimmedString(searchParams.get('businessId'));
    const version = asTrimmedString(searchParams.get('rev'));
    const versioningEnabled = isWalletAssetVersioningEnabled();

    if (!businessId) {
      return new Response('businessId requerido', { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: businessId },
      include: {
        loyaltyMilestones: {
          orderBy: { visitTarget: 'asc' },
        },
      },
    });

    if (!tenant) {
      return new Response('Negocio no encontrado', { status: 404 });
    }

    let currentVisits = 0;
    if (customerId) {
      const membership = await prisma.membership.findUnique({
        where: { tenantId_userId: { tenantId: businessId, userId: customerId } },
      });
      if (membership) {
        currentVisits = membership.currentVisits;
      }
    }

    const walletStyle = (await getTenantWalletStyle(tenant.id)) || defaultTenantWalletStyle(tenant.id);

    const prizeEmoji = asTrimmedString(searchParams.get('prizeEmoji')) || '🏆';

    const response = await generateDynamicStripResponse({
      businessName: tenant.name || 'Punto IA',
      currentVisits,
      requiredVisits: tenant.requiredVisits ?? 10,
      bgColor: walletStyle.backgroundColor || '#1F2937',
      fgColor: walletStyle.foregroundColor || '#9CA3AF',
      labelColor: walletStyle.labelColor || '#3B82F6',
      stripImageData: walletStyle.stripImageData,
      prizeEmoji,
      milestones: tenant.loyaltyMilestones || [],
    });

    response.headers.set(
      'Cache-Control',
      versioningEnabled && version ? 'public, max-age=31536000, immutable' : 'no-store, max-age=0',
    );

    return response;
  } catch (e: unknown) {
    console.error('Error generating dynamic strip:', e);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
