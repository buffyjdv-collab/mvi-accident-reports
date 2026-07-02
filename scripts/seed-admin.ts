import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@mvi.local').toLowerCase().trim();
  const password = process.env.SEED_ADMIN_PASSWORD || 'admin123';
  const name = process.env.SEED_ADMIN_NAME || 'Administrator';

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`✅ Admin user already exists: ${email} (role=${existing.role})`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.user.create({
    data: { name, email, passwordHash, role: 'ADMIN' },
  });

  console.log('✅ Admin user created:');
  console.log(`   Name:     ${user.name}`);
  console.log(`   Email:    ${user.email}`);
  console.log(`   Password: ${password}`);
  console.log(`   Role:     ${user.role}`);
  console.log('');
  console.log('⚠️  Change this password after first login!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
