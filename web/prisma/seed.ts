// web/prisma/seed.ts
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Sembrando datos...')

  // 1. Crear Negocio
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'cafeteria-central' },
    update: {},
    create: {
      name: 'Cafetería Central',
      slug: 'cafeteria-central',
    },
  })

  // 2. Crear Usuario
  const user = await prisma.user.upsert({
    where: { phone: '5512345678' },
    update: {},
    create: {
      name: 'Juan Pérez',
      phone: '5512345678',
    },
  })

  // 3. Crear Código del Día
  await prisma.dailyCode.create({
    data: {
      code: 'CAFE-123',
      tenantId: tenant.id,
      validDate: new Date(),
      isActive: true,
    },
  })

  console.log('✅ ¡Datos creados correctamente!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
