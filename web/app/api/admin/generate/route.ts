// web/app/api/admin/generate/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Función auxiliar para crear códigos aleatorios (ej: WX-928)
function generateRandomCode() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  let result = '';
  for (let i = 0; i < 2; i++) result += letters.charAt(Math.floor(Math.random() * letters.length));
  result += '-';
  for (let i = 0; i < 3; i++) result += numbers.charAt(Math.floor(Math.random() * numbers.length));
  return result;
}

export async function POST(request: Request) {
  try {
    // En una app real, aquí verificaríamos la sesión del admin
    // Por ahora, asumimos que es "Cafetería Central"
    const tenantSlug = 'cafeteria-central';

    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) return NextResponse.json({ error: 'Negocio no encontrado' }, { status: 404 });

    // 1. Desactivar códigos anteriores de este negocio
    await prisma.dailyCode.updateMany({
      where: { tenantId: tenant.id, isActive: true },
      data: { isActive: false }
    });

    // 2. Generar nuevo código único
    const newCodeString = generateRandomCode();

    // 3. Guardarlo en BD
    const newDailyCode = await prisma.dailyCode.create({
      data: {
        code: newCodeString,
        tenantId: tenant.id,
        validDate: new Date(),
        isActive: true
      }
    });

    return NextResponse.json({ success: true, code: newDailyCode.code });

  } catch (error) {
    return NextResponse.json({ error: 'Error generando código' }, { status: 500 });
  }
}
