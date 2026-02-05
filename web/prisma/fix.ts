// web/prisma/fix.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("🔧 Reparando la Cafetería...");

  // Esto crea el negocio si no existe
  await prisma.tenant.upsert({
    where: { slug: 'cafeteria-central' },
    update: {},
    create: {
      name: 'Cafetería Central',
      slug: 'cafeteria-central'
    }
  });

  console.log("✅ ¡Cafetería Central lista para operar!");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
