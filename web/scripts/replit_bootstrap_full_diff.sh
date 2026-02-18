#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(pwd)"
if [[ -f "web/package.json" ]]; then
  ROOT_DIR="$(cd web && pwd)"
elif [[ -f "package.json" ]] && [[ -d "app" ]]; then
  ROOT_DIR="$(pwd)"
else
  echo "❌ Ejecuta en /home/runner/workspace o /home/runner/workspace/web"
  exit 1
fi
cd "$ROOT_DIR"
echo "📁 Working dir: $ROOT_DIR"

mkdir -p "$(dirname "app/aliados/page.tsx")"
cat > "app/aliados/page.tsx" <<'EOF_app_aliados_page_tsx'
import Link from 'next/link';

const perks = [
  'Aumenta visitas recurrentes con check-in QR.',
  'Convierte clientes en fans con recompensas claras.',
  'Mide actividad y canjes desde un panel simple.',
  'Lanzamiento rápido pensado para pymes en México.',
];

export default function AliadosPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-fuchsia-50 text-gray-900">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-14 md:py-20">
        <div className="rounded-3xl border border-orange-100 bg-white/90 p-8 shadow-xl">
          <p className="mb-3 inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-black uppercase tracking-wider text-orange-700">
            Programa para negocios
          </p>
          <h1 className="text-3xl font-black leading-tight md:text-5xl">
            Haz que tu negocio se convierta en <span className="text-fuchsia-600">aliado de Punto IA</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-gray-600 md:text-base">
            Ayudamos a tu negocio a fidelizar clientes con un sistema de puntos fácil de usar. Tus clientes
            registran visitas, acumulan beneficios y regresan más seguido.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-2">
            {perks.map((perk) => (
              <div key={perk} className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm font-semibold shadow-sm">
                ✨ {perk}
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="mailto:ventas@puntoia.mx?subject=Quiero%20ser%20aliado%20de%20Punto%20IA"
              className="inline-flex items-center justify-center rounded-2xl bg-fuchsia-600 px-5 py-3 text-sm font-black text-white shadow-lg transition hover:bg-fuchsia-700"
            >
              Quiero una demo
            </a>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-2xl border border-gray-300 bg-white px-5 py-3 text-sm font-black text-gray-700 transition hover:bg-gray-50"
            >
              Volver a inicio
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
EOF_app_aliados_page_tsx
echo "✅ app/aliados/page.tsx"

mkdir -p "$(dirname "app/api/admin/generate/route.ts")"
cat > "app/api/admin/generate/route.ts" <<'EOF_app_api_admin_generate_route_ts'
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
const BUSINESS_TZ = 'America/Monterrey';

// Alfabeto sin caracteres confusos (sin I, O, 0, 1)
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// Código robusto (12 chars + guion): XXXX-XXXX-XXXX
function generateRobustCode() {
  const parts = [4, 4, 4].map((len) => {
    let out = "";
    for (let i = 0; i < len; i++) {
      const idx = crypto.randomInt(0, ALPHABET.length);
      out += ALPHABET[idx];
    }
    return out;
  });
  return parts.join("-");
}

function dayKeyInBusinessTz(d = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);

  const get = (type: string) => parts.find((part) => part.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`; // YYYY-MM-DD
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tenantId, tenantUserId } = body;

    if (!tenantId) return NextResponse.json({ error: 'Falta Tenant ID' }, { status: 400 });
    if (!tenantUserId) return NextResponse.json({ error: 'Falta TenantUser ID' }, { status: 400 });

    const day = dayKeyInBusinessTz();

    // Si el empleado ya generó hoy, regresa el existente (no crea otro)
    const existing = await prisma.dailyCode.findFirst({
      where: {
        tenantId,
        generatedById: tenantUserId,
        day,
        isActive: true,
      },
      orderBy: { validDate: 'desc' },
    });

    if (existing) {
      return NextResponse.json({ code: existing.code, reused: true, day });
    }

    // Genera y guarda
    const finalCode = generateRobustCode();

    const saved = await prisma.dailyCode.create({
      data: {
        code: finalCode,
        tenantId,
        generatedById: tenantUserId,
        day,
        isActive: true,
      },
    });

    return NextResponse.json({ code: saved.code, reused: false, day });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}
EOF_app_api_admin_generate_route_ts
echo "✅ app/api/admin/generate/route.ts"

mkdir -p "$(dirname "app/api/check-in/scan/route.ts")"
cat > "app/api/check-in/scan/route.ts" <<'EOF_app_api_check-in_scan_route_ts'
import { NextResponse } from 'next/server';
import { logApiError, logApiEvent } from '@/app/lib/api-log';
import { PrismaClient, RewardPeriod } from '@prisma/client';

const prisma = new PrismaClient();
const TZ = 'America/Monterrey';

function dayKeyInBusinessTz(d = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d);

  const get = (type: string) => parts.find((part) => part.type === type)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`; // para DailyCode.day
}

function tzParts(d: Date) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = fmt.formatToParts(d);
  const get = (t: string) => parts.find(p => p.type === t)?.value || '';
  return { y: parseInt(get('year'), 10), m: parseInt(get('month'), 10), day: parseInt(get('day'), 10) };
}

function periodKey(period: RewardPeriod, now = new Date()) {
  if (period === 'OPEN') return 'OPEN';
  const { y, m } = tzParts(now);
  if (period === 'MONTHLY') return `${y}-M${String(m).padStart(2, '0')}`;
  if (period === 'QUARTERLY') return `${y}-Q${Math.floor((m - 1) / 3) + 1}`;
  if (period === 'SEMESTER') return `${y}-S${m <= 6 ? 1 : 2}`;
  return `${y}-Y`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, code } = body;

    if (!userId || !code) {
      logApiEvent('/api/check-in/scan', 'validation_error', { hasUserId: Boolean(userId), hasCode: Boolean(code) });
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const dayUTC = dayKeyInBusinessTz();

    const validCode = await prisma.dailyCode.findFirst({
      where: { code, isActive: true, day: dayUTC },
      include: { tenant: true },
    });

    if (!validCode) {
      logApiEvent('/api/check-in/scan', 'invalid_code', { userId });
      return NextResponse.json({ error: 'Código inválido o no es de hoy' }, { status: 404 });
    }

    let membership = await prisma.membership.findFirst({
      where: { userId, tenantId: validCode.tenantId },
    });

    if (!membership) {
      membership = await prisma.membership.create({
        data: {
          userId,
          tenantId: validCode.tenantId,
          currentVisits: 0,
          totalVisits: 0,
          periodKey: 'OPEN',
          periodType: 'OPEN',
        },
      });
    }

    // anti duplicado por día/negocio
    const visitDay = dayUTC;
    const alreadyToday = await prisma.visit.findFirst({
      where: { membershipId: membership.id, tenantId: validCode.tenantId, visitDay },
    });
    if (alreadyToday) {
      logApiEvent('/api/check-in/scan', 'duplicate_visit', { userId, tenantId: validCode.tenantId, visitDay });
      return NextResponse.json({ error: '¡Ya registraste tu visita hoy!' }, { status: 400 });
    }

    const now = new Date();
    const tenantPeriod = (validCode.tenant.rewardPeriod as RewardPeriod) || 'OPEN';
    const appliedType = (membership.periodType as RewardPeriod) || 'OPEN';

    // cambio de regla: adoptar sin reset
    if (appliedType !== tenantPeriod) {
      const newKey = periodKey(tenantPeriod, now);
      membership = await prisma.membership.update({
        where: { id: membership.id },
        data: { periodType: tenantPeriod, periodKey: newKey },
      });
    }

    // expiración natural
    const curType = (membership.periodType as RewardPeriod) || 'OPEN';
    const curKey = periodKey(curType, now);

    if ((membership.periodKey || 'OPEN') !== curKey) {
      membership = await prisma.membership.update({
        where: { id: membership.id },
        data: { currentVisits: 0, periodKey: curKey },
      });
    }

    const [, updatedMembership] = await prisma.$transaction([
      prisma.visit.create({
        data: {
          membershipId: membership.id,
          dailyCodeId: validCode.id,
          tenantId: validCode.tenantId,
          visitDay,
        },
      }),
      prisma.membership.update({
        where: { id: membership.id },
        data: {
          currentVisits: { increment: 1 },
          totalVisits: { increment: 1 },
          lastVisitAt: new Date(),
        },
      }),
    ]);

    logApiEvent('/api/check-in/scan', 'visit_registered', { userId, tenantId: validCode.tenantId, visitDay });

    return NextResponse.json({
      success: true,
      visits: updatedMembership.currentVisits,
      requiredVisits: validCode.tenant.requiredVisits ?? 10,
      rewardPeriod: validCode.tenant.rewardPeriod,
      message: `¡Visita registrada en ${validCode.tenant.name}!`,
    });

  } catch (error: unknown) {
    logApiError('/api/check-in/scan', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error técnico' }, { status: 500 });
  }
}
EOF_app_api_check-in_scan_route_ts
echo "✅ app/api/check-in/scan/route.ts"

mkdir -p "$(dirname "app/api/debug/route.ts")"
cat > "app/api/debug/route.ts" <<'EOF_app_api_debug_route_ts'
import { NextResponse } from 'next/server';

function pickFirstNonEmpty(...values: Array<string | undefined>) {
  return values.find((value) => typeof value === 'string' && value.trim().length > 0) ?? null;
}

export async function GET() {
  const commitSha = pickFirstNonEmpty(
    process.env.VERCEL_GIT_COMMIT_SHA,
    process.env.NEXT_PUBLIC_COMMIT_SHA,
  );

  const branch = pickFirstNonEmpty(
    process.env.VERCEL_GIT_COMMIT_REF,
    process.env.NEXT_PUBLIC_GIT_BRANCH,
  );

  return NextResponse.json({
    ok: true,
    service: 'puntos-ia',
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'unknown',
    branch,
    commitSha,
    timestamp: new Date().toISOString(),
  });
}
EOF_app_api_debug_route_ts
echo "✅ app/api/debug/route.ts"

mkdir -p "$(dirname "app/api/master/create-tenant/route.ts")"
cat > "app/api/master/create-tenant/route.ts" <<'EOF_app_api_master_create-tenant_route_ts'
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { isValidMasterPassword } from '@/app/lib/master-auth';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { masterPassword, name, slug } = body;

    if (!isValidMasterPassword(masterPassword)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (!name || !slug) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

    const prefix = name.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 99).toString();

    const newTenant = await prisma.tenant.create({
      data: { name, slug, codePrefix: prefix },
    });

    return NextResponse.json({ success: true, tenant: newTenant });
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ) {
      return NextResponse.json({ error: 'Slug o Prefijo duplicado' }, { status: 400 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error interno' },
      { status: 500 }
    );
  }
}
EOF_app_api_master_create-tenant_route_ts
echo "✅ app/api/master/create-tenant/route.ts"

mkdir -p "$(dirname "app/api/master/create-user/route.ts")"
cat > "app/api/master/create-user/route.ts" <<'EOF_app_api_master_create-user_route_ts'
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { isValidMasterPassword } from '@/app/lib/master-auth';
import { hashPassword } from '@/app/lib/password';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { masterPassword, tenantId, name, phone, email, username, password, role } = body;

    if (!isValidMasterPassword(masterPassword)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return NextResponse.json({ error: 'Negocio no existe' }, { status: 400 });

    const rawPassword = String(password || '');
    if (!rawPassword) {
      return NextResponse.json({ error: 'Password requerido' }, { status: 400 });
    }

    const prefix = tenant.codePrefix || tenant.slug.substring(0, 4).toUpperCase();
    const fullUsername = `${prefix}.${username}`;

    const newUser = await prisma.tenantUser.create({
      data: {
        tenantId,
        name,
        phone,
        email,
        password: hashPassword(rawPassword),
        role,
        username: fullUsername,
      },
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch {
    return NextResponse.json({ error: 'Usuario duplicado o error' }, { status: 500 });
  }
}
EOF_app_api_master_create-user_route_ts
echo "✅ app/api/master/create-user/route.ts"

mkdir -p "$(dirname "app/api/master/list-tenants/route.ts")"
cat > "app/api/master/list-tenants/route.ts" <<'EOF_app_api_master_list-tenants_route_ts'
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { isValidMasterPassword } from '@/app/lib/master-auth';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!isValidMasterPassword(body.masterPassword)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const tenants = await prisma.tenant.findMany({
      include: { users: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ tenants });
  } catch {
    return NextResponse.json({ error: 'Error' }, { status: 500 });
  }
}
EOF_app_api_master_list-tenants_route_ts
echo "✅ app/api/master/list-tenants/route.ts"

mkdir -p "$(dirname "app/api/master/manage-tenant/route.ts")"
cat > "app/api/master/manage-tenant/route.ts" <<'EOF_app_api_master_manage-tenant_route_ts'
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { isValidMasterPassword } from '@/app/lib/master-auth';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { masterPassword, action, tenantId, data } = body;

    if (!isValidMasterPassword(masterPassword)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    if (action === 'DELETE') {
      await prisma.tenant.delete({ where: { id: tenantId } });
      return NextResponse.json({ success: true });
    }

    if (action === 'UPDATE') {
      const updated = await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          name: data.name,
          slug: data.slug,
          prize: data.prize,
          instagram: data.instagram,
          isActive: data.isActive,
        },
      });
      return NextResponse.json({ success: true, tenant: updated });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error inesperado' },
      { status: 500 }
    );
  }
}
EOF_app_api_master_manage-tenant_route_ts
echo "✅ app/api/master/manage-tenant/route.ts"

mkdir -p "$(dirname "app/api/master/manage-user/route.ts")"
cat > "app/api/master/manage-user/route.ts" <<'EOF_app_api_master_manage-user_route_ts'
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { isValidMasterPassword } from '@/app/lib/master-auth';
import { hashPassword, isHashedPassword } from '@/app/lib/password';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { masterPassword, action, userId, data } = body;

    if (!isValidMasterPassword(masterPassword)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (action === 'DELETE') {
      await prisma.tenantUser.delete({ where: { id: userId } });
      return NextResponse.json({ success: true });
    }

    if (action === 'UPDATE') {
      const nextPasswordRaw = String(data?.password || '');
      const nextPassword =
        !nextPasswordRaw
          ? undefined
          : isHashedPassword(nextPasswordRaw)
            ? nextPasswordRaw
            : hashPassword(nextPasswordRaw);

      const updated = await prisma.tenantUser.update({
        where: { id: userId },
        data: {
          name: data.name,
          username: data.username,
          password: nextPassword,
          role: data.role,
          phone: data.phone,
          email: data.email,
        },
      });
      return NextResponse.json({ success: true, user: updated });
    }

    return NextResponse.json({ error: 'Acción no válida' }, { status: 400 });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error inesperado' }, { status: 500 });
  }
}
EOF_app_api_master_manage-user_route_ts
echo "✅ app/api/master/manage-user/route.ts"

mkdir -p "$(dirname "app/api/redeem/request/route.ts")"
cat > "app/api/redeem/request/route.ts" <<'EOF_app_api_redeem_request_route_ts'
import { NextResponse } from 'next/server';
import { logApiError, logApiEvent } from '@/app/lib/api-log';
import { PrismaClient, RewardPeriod } from '@prisma/client';

const prisma = new PrismaClient();
const TZ = 'America/Monterrey';

function tzParts(d: Date) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
  });
  const parts = fmt.formatToParts(d);
  const get = (t: string) => parts.find(p => p.type === t)?.value || '';
  return { y: parseInt(get('year'), 10), m: parseInt(get('month'), 10) };
}
function periodKey(period: RewardPeriod, now = new Date()) {
  if (period === 'OPEN') return 'OPEN';
  const { y, m } = tzParts(now);
  if (period === 'MONTHLY') return `${y}-M${String(m).padStart(2, '0')}`;
  if (period === 'QUARTERLY') return `${y}-Q${Math.floor((m - 1) / 3) + 1}`;
  if (period === 'SEMESTER') return `${y}-S${m <= 6 ? 1 : 2}`;
  return `${y}-Y`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, tenantId } = body;

    if (!userId || !tenantId) {
      logApiEvent('/api/redeem/request', 'validation_error', { hasUserId: Boolean(userId), hasTenantId: Boolean(tenantId) });
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) {
      logApiEvent('/api/redeem/request', 'tenant_not_found', { tenantId });
      return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });
    }

    let membership = await prisma.membership.findUnique({
      where: { tenantId_userId: { tenantId, userId } }
    });

    if (!membership) {
      logApiEvent('/api/redeem/request', 'membership_not_found', { userId, tenantId });
      return NextResponse.json({ error: 'No tienes membresía' }, { status: 400 });
    }

    const now = new Date();
    const tenantPeriod = (tenant.rewardPeriod as RewardPeriod) || 'OPEN';
    const appliedType = (membership.periodType as RewardPeriod) || 'OPEN';

    // cambio de regla: adoptar sin reset
    if (appliedType !== tenantPeriod) {
      const newKey = periodKey(tenantPeriod, now);
      membership = await prisma.membership.update({
        where: { id: membership.id },
        data: { periodType: tenantPeriod, periodKey: newKey },
      });
    }

    // expiración natural
    const curType = (membership.periodType as RewardPeriod) || 'OPEN';
    const curKey = periodKey(curType, now);

    if ((membership.periodKey || 'OPEN') !== curKey) {
      membership = await prisma.membership.update({
        where: { id: membership.id },
        data: { currentVisits: 0, periodKey: curKey },
      });
    }

    const requiredVisits = tenant.requiredVisits ?? 10;
    const currentVisits = membership.currentVisits ?? 0;

    if (currentVisits < requiredVisits) {
      logApiEvent('/api/redeem/request', 'insufficient_visits', { userId, tenantId, currentVisits, requiredVisits });
      return NextResponse.json({ error: `Te faltan ${requiredVisits - currentVisits} visita(s) para canjear` }, { status: 400 });
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();

    await prisma.$transaction([
      prisma.redemption.create({
        data: { code, userId, tenantId, isUsed: false }
      }),
      prisma.membership.update({
        where: { id: membership.id },
        data: { currentVisits: 0 }
      })
    ]);

    logApiEvent('/api/redeem/request', 'redemption_requested', { userId, tenantId, code });

    return NextResponse.json({ success: true, code });

  } catch (error: unknown) {
    logApiError('/api/redeem/request', error);
    return NextResponse.json({ error: 'Error técnico: ' + (error instanceof Error ? error.message : '') }, { status: 500 });
  }
}
EOF_app_api_redeem_request_route_ts
echo "✅ app/api/redeem/request/route.ts"

mkdir -p "$(dirname "app/api/redeem/validate/route.ts")"
cat > "app/api/redeem/validate/route.ts" <<'EOF_app_api_redeem_validate_route_ts'
import { NextResponse } from 'next/server';
import { logApiError, logApiEvent } from '@/app/lib/api-log';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tenantId = String(body?.tenantId || '').trim();
    const code = String(body?.code || '').trim();

    if (!tenantId || !code) {
      logApiEvent('/api/redeem/validate', 'validation_error', { hasTenantId: Boolean(tenantId), hasCode: Boolean(code) });
      return NextResponse.json(
        { error: 'tenantId y code son requeridos' },
        { status: 400 }
      );
    }

    // VALIDAR premio YA GANADO (NO recalcula puntos/visitas)
    const redemption = await prisma.redemption.findFirst({
      where: { tenantId, code, isUsed: false },
      include: { user: true },
    });

    if (!redemption) {
      logApiEvent('/api/redeem/validate', 'invalid_or_used_code', { tenantId, code });
      return NextResponse.json(
        { error: 'Código inválido o ya fue canjeado' },
        { status: 404 }
      );
    }

    await prisma.redemption.update({
      where: { id: redemption.id },
      data: { isUsed: true },
    });

    logApiEvent('/api/redeem/validate', 'redemption_validated', { tenantId, code, redemptionId: redemption.id });

    return NextResponse.json({
      ok: true,
      user: redemption.user?.name || redemption.user?.phone || 'Usuario',
      redemption: {
        id: redemption.id,
        code: redemption.code,
        tenantId: redemption.tenantId,
        isUsed: true,
        usedAt: new Date().toISOString(),
      },
    });
  } catch (error: unknown) {
    logApiError('/api/redeem/validate', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error inesperado' },
      { status: 500 }
    );
  }
}
EOF_app_api_redeem_validate_route_ts
echo "✅ app/api/redeem/validate/route.ts"

mkdir -p "$(dirname "app/api/tenant/login/route.ts")"
cat > "app/api/tenant/login/route.ts" <<'EOF_app_api_tenant_login_route_ts'
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hashPassword, isHashedPassword, verifyPassword } from '@/app/lib/password';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body?.username || '').trim();
    const password = String(body?.password || '');

    if (!username || !password) {
      return NextResponse.json({ error: 'Credenciales incompletas' }, { status: 400 });
    }

    const user = await prisma.tenantUser.findUnique({
      where: { username },
      include: { tenant: true },
    });

    if (!user || !verifyPassword(password, user.password)) {
      return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 });
    }

    if (!isHashedPassword(user.password)) {
      await prisma.tenantUser.update({
        where: { id: user.id },
        data: { password: hashPassword(password) },
      });
    }

    if (user.tenant.isActive === false) {
      return NextResponse.json({ error: 'Este negocio ha sido suspendido. Contacta a soporte.' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, role: user.role },
      tenant: {
        id: user.tenant.id,
        name: user.tenant.name,
        slug: user.tenant.slug,
        prize: user.tenant.prize,
        instagram: user.tenant.instagram,
        lat: user.tenant.lat,
        lng: user.tenant.lng,
        address: user.tenant.address,
        requiredVisits: user.tenant.requiredVisits,
        rewardPeriod: user.tenant.rewardPeriod,
        logoData: user.tenant.logoData,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
EOF_app_api_tenant_login_route_ts
echo "✅ app/api/tenant/login/route.ts"

mkdir -p "$(dirname "app/api/user/login/route.ts")"
cat > "app/api/user/login/route.ts" <<'EOF_app_api_user_login_route_ts'
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hashPassword, isHashedPassword, verifyPassword } from '@/app/lib/password';

const prisma = new PrismaClient();

type LoginBody = {
  phone?: string;
  password?: string;
};

export async function POST(req: Request) {
  try {
    const { phone, password } = (await req.json()) as LoginBody;
    const normalizedPhone = String(phone || '').trim();

    if (!normalizedPhone) {
      return NextResponse.json({ error: 'Teléfono requerido' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
      include: {
        memberships: {
          include: { tenant: true },
        },
      },
    });

    if (!user) return NextResponse.json({ error: 'Usuario no existe' }, { status: 401 });

    if (typeof user.password === 'string' && user.password.length > 0) {
      const inputPassword = String(password || '');
      const validPassword = verifyPassword(inputPassword, user.password);

      if (!validPassword) {
        return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 });
      }

      if (!isHashedPassword(user.password)) {
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashPassword(inputPassword) },
        });
      }
    }

    const memberships = user.memberships
      .filter((membership) => membership?.tenant?.isActive !== false)
      .map((membership) => {
        const visits = Number(membership.currentVisits ?? 0);
        const points = visits * 10;

        return {
          tenantId: membership.tenantId,
          name: membership.tenant?.name,
          prize: membership.tenant?.prize ?? 'Premio Sorpresa',
          instagram: membership.tenant?.instagram ?? '',
          requiredVisits: membership.tenant?.requiredVisits ?? 10,
          rewardPeriod: membership.tenant?.rewardPeriod ?? 'OPEN',
          logoData: membership.tenant?.logoData ?? '',
          visits,
          points,
        };
      });

    return NextResponse.json({
      id: user.id,
      phone: user.phone,
      name: user.name ?? '',
      email: user.email ?? '',
      gender: user.gender ?? '',
      birthDate: user.birthDate ?? null,
      memberships,
    });
  } catch (error: unknown) {
    const message =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message?: string }).message || 'Error')
        : 'Error';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
EOF_app_api_user_login_route_ts
echo "✅ app/api/user/login/route.ts"

mkdir -p "$(dirname "app/api/user/register/route.ts")"
cat > "app/api/user/register/route.ts" <<'EOF_app_api_user_register_route_ts'
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@/app/lib/password';

const prisma = new PrismaClient();

type RegisterBody = {
  name?: string;
  phone?: string;
  email?: string;
  password?: string;
  gender?: string;
  birthDate?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterBody;
    const name = String(body.name || '').trim();
    const phone = String(body.phone || '').trim();
    const email = String(body.email || '').trim();
    const password = String(body.password || '').trim();
    const gender = String(body.gender || '').trim();
    const birthDate = body.birthDate;

    if (!name || !phone || !password) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    let cleanGender = 'Otro';
    if (gender === 'Hombre') cleanGender = 'Hombre';
    if (gender === 'Mujer') cleanGender = 'Mujer';

    let finalDate: Date | null = null;
    if (birthDate) {
      finalDate = new Date(`${birthDate}T12:00:00Z`);
      if (isNaN(finalDate.getTime())) finalDate = null;
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        phone,
        email: email || null,
        password: hashPassword(password),
        gender: cleanGender,
        birthDate: finalDate,
      },
    });

    return NextResponse.json({ id: newUser.id, name: newUser.name });
  } catch (error: unknown) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    ) {
      return NextResponse.json({ error: 'Teléfono ya registrado' }, { status: 400 });
    }

    const message =
      typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message?: string }).message || 'Error interno')
        : 'Error interno';

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
EOF_app_api_user_register_route_ts
echo "✅ app/api/user/register/route.ts"

mkdir -p "$(dirname "app/lib/api-log.ts")"
cat > "app/lib/api-log.ts" <<'EOF_app_lib_api-log_ts'
export function logApiEvent(
  route: string,
  event: string,
  data: Record<string, unknown> = {}
) {
  console.info(
    JSON.stringify({
      level: 'info',
      route,
      event,
      ts: new Date().toISOString(),
      ...data,
    })
  );
}

export function logApiError(
  route: string,
  error: unknown,
  data: Record<string, unknown> = {}
) {
  const message = error instanceof Error ? error.message : String(error);

  console.error(
    JSON.stringify({
      level: 'error',
      route,
      ts: new Date().toISOString(),
      message,
      ...data,
    })
  );
}
EOF_app_lib_api-log_ts
echo "✅ app/lib/api-log.ts"

mkdir -p "$(dirname "app/lib/master-auth.ts")"
cat > "app/lib/master-auth.ts" <<'EOF_app_lib_master-auth_ts'
const DEFAULT_MASTER_PASSWORD = 'superadmin2026';

export function isValidMasterPassword(input: unknown): boolean {
  const provided = String(input || '');
  const expected = process.env.MASTER_PASSWORD || DEFAULT_MASTER_PASSWORD;
  return provided.length > 0 && provided === expected;
}
EOF_app_lib_master-auth_ts
echo "✅ app/lib/master-auth.ts"

mkdir -p "$(dirname "app/lib/password.ts")"
cat > "app/lib/password.ts" <<'EOF_app_lib_password_ts'
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const KEY_LENGTH = 64;

export function hashPassword(rawPassword: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(rawPassword, salt, KEY_LENGTH).toString('hex');
  return `scrypt$${salt}$${hash}`;
}

export function isHashedPassword(value: string): boolean {
  return value.startsWith('scrypt$');
}

export function verifyPassword(rawPassword: string, storedPassword: string): boolean {
  if (!isHashedPassword(storedPassword)) {
    return rawPassword === storedPassword;
  }

  const [, salt, storedHash] = storedPassword.split('$');
  if (!salt || !storedHash) return false;

  const derived = scryptSync(rawPassword, salt, KEY_LENGTH);
  const hashBuffer = Buffer.from(storedHash, 'hex');

  if (derived.length !== hashBuffer.length) return false;
  return timingSafeEqual(derived, hashBuffer);
}
EOF_app_lib_password_ts
echo "✅ app/lib/password.ts"

node - <<'NODE_PATCH'
const fs = require('fs');
const path = 'app/page.tsx';
let text = fs.readFileSync(path, 'utf8');

if (!text.includes("import Link from 'next/link';")) {
  text = text.replace(
    "import { useEffect, useMemo, useState } from 'react';\n",
    "import { useEffect, useMemo, useState } from 'react';\nimport Link from 'next/link';\n"
  );
}

if (!text.includes('href="/aliados"')) {
  const marker = `            <div className="w-full pt-8 border-t border-white/20">\n              <p className="text-center text-white/70 text-xs font-black uppercase tracking-widest mb-6">\n                ¿CÓMO FUNCIONA?\n              </p>\n              <Onboarding />\n            </div>\n`;

  const cta = `\n\n            <Link\n              href="/aliados"\n              className="mt-8 inline-flex items-center justify-center rounded-full border border-white/50 bg-white/15 px-5 py-3 text-sm font-black tracking-wide text-white shadow-lg backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/25"\n            >\n              ¿Quieres que tu negocio sea aliado de Punto IA? <span className="ml-2 underline">Conoce más</span>\n            </Link>\n`;

  if (!text.includes(marker)) {
    console.error('❌ No encontré el bloque WELCOME esperado en app/page.tsx. Inserta CTA manualmente.');
    process.exit(1);
  }

  text = text.replace(marker, marker + cta);
}

fs.writeFileSync(path, text);
console.log('✅ CTA /aliados listo en app/page.tsx');
NODE_PATCH


echo ""
echo "✅ Bootstrap completo aplicado."
echo "Siguiente:"
echo "  npm install"
echo "  npm run build"
echo "  cd .."
echo "  git add web/app web/scripts/replit_bootstrap_full_diff.sh"
echo '  git commit -m "feat: bootstrap full diff from codex"'
echo "  git push origin main"
