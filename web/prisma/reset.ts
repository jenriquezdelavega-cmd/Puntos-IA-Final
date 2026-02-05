// web/prisma/reset.ts
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const phone = '5512345678'; // Tu número
  console.log(`🔍 Buscando usuario ${phone}...`);

  const user = await prisma.user.findUnique({ where: { phone } });

  if (!user) {
    console.log("❌ Usuario no encontrado.");
  } else {
    console.log(`🔐 Password actual (el que fallaba): "${user.password}"`);

    // Forzamos el cambio a "1234"
    await prisma.user.update({
      where: { phone },
      data: { password: '1234' }
    });
    console.log("✅ ¡Listo! Tu password ahora es oficialmente: '1234'");
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
