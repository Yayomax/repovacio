/**
 * Seed idempotente: garantiza que exista el usuario administrador.
 * Se ejecuta en cada arranque del contenedor; el password del admin
 * siempre se sincroniza con ADMIN_PASSWORD.
 */
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || "soyadmin@admin.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "0987654321";
  const name = process.env.ADMIN_NAME || "Administrador";

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", passwordHash },
    create: {
      email,
      name,
      passwordHash,
      role: "ADMIN",
      emailVerified: new Date(),
    },
  });

  console.log(`✔ Usuario administrador listo: ${email}`);
}

main()
  .catch((error) => {
    console.error("Error en el seed:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
