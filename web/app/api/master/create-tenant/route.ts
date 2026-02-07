import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { masterPassword, name, slug } = body;

    if (masterPassword !== 'superadmin2026') return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    if (!name || !slug) return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });

    // GENERAR PREFIJO ÚNICO (5 LETRAS MAYÚSCULAS)
    // Ej: "PIZZA", "FARM1", "X7Z9A"
    const prefix = name.substring(0, 3).toUpperCase() + Math.floor(Math.random() * 99).toString(); 
    
    // Asegurar que sea único (simple check)
    // En prod haríamos un loop, aquí confiamos en el random
    
    const newTenant = await prisma.tenant.create({
      data: { name, slug, codePrefix: prefix }
    });

    return NextResponse.json({ success: true, tenant: newTenant });
  } catch (error: any) {
    if (error.code === 'P2002') return NextResponse.json({ error: 'Slug o Prefijo duplicado' }, { status: 400 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
