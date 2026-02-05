// web/prisma/init.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("🏗️ Inaugurando base de datos en la nube...");

  const tenant = await prisma.tenant.upsert({
    where: { slug: 'cafeteria-central' },
    update: {},
    create: {
      name: 'Cafetería Central',
      slug: 'cafeteria-central'
    }
  });

  console.log(`✅ Negocio creado: ${tenant.name}`);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());
