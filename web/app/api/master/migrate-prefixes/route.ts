import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(_request: Request) {
  try {
    // Buscar negocios SIN prefijo
    const tenants = await prisma.tenant.findMany({
      where: { codePrefix: null }
    });

    const updates = [];

    for (const t of tenants) {
      // Generar prefijo: Primeras 3 letras del nombre + 2 nums random
      let prefix = t.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
      if (prefix.length < 3) prefix = "NEG";
      prefix += Math.floor(10 + Math.random() * 90).toString();

      // Actualizar uno por uno
      const update = prisma.tenant.update({
        where: { id: t.id },
        data: { codePrefix: prefix }
      });
      updates.push(update);
    }

    await prisma.$transaction(updates);

    return NextResponse.json({ 
      success: true, 
      message: `Actualizados ${updates.length} negocios con prefijos.` 
    });

  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error' }, { status: 500 });
  }
}
