import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import crypto from 'crypto';
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
