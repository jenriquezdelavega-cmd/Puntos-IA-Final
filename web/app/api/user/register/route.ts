import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log("📝 DATOS RECIBIDOS:", body); // Veremos esto en los logs

    const { name, phone, password, gender, birthDate } = body;

    // Validación básica
    if (!name || !phone || !password) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // Conversión de Fecha EXPLÍCITA
    let finalDate = null;
    if (birthDate) {
      // Forzamos el formato ISO-8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
      // Añadimos hora para evitar problemas de zona horaria
      finalDate = new Date(birthDate + "T12:00:00Z"); 
      
      if (isNaN(finalDate.getTime())) {
         console.log("❌ Fecha inválida:", birthDate);
         return NextResponse.json({ error: 'Formato de fecha inválido' }, { status: 400 });
      }
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        phone,
        password,
        gender: gender || 'No especificado',
        birthDate: finalDate, 
        points: 0
      }
    });

    return NextResponse.json({ id: newUser.id });

  } catch (error: any) {
    console.error("🔥 ERROR DETALLADO:", error);
    // Devolvemos el mensaje técnico exacto para que lo veas en pantalla
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
