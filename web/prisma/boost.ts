const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  // Pon el teléfono con el que te registraste
  const myPhone = '5512345678'; 

  const user = await prisma.user.findUnique({ where: { phone: myPhone } });

  if (!user) {
      console.log("❌ Usuario no encontrado. Regístrate en la app primero.");
      return;
  }

  // ¡Magia! Te damos 10 visitas de golpe
  await prisma.membership.updateMany({
    where: { userId: user.id },
    data: { currentVisits: 10 }
  });

  console.log(`🚀 ¡Listo! ${myPhone} ahora tiene 10 visitas. Ve a probar el canje.`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect())
