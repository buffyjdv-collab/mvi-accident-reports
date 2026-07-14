/**
 * Seed script: ensures a Super Admin account exists.
 *
 * Usage:
 *   bun run db:seed
 *
 * Credentials are read from env vars (with safe defaults for local dev):
 *   ADMIN_EMAIL (default: admin@mvinspector.gov.in)
 *   ADMIN_PASSWORD (default: admin123)
 *   ADMIN_NAME (default: Super Admin)
 *
 * If the admin already exists, the script is a no-op (it will NOT overwrite
 * an existing password).
 */
import { db } from '../src/lib/db';
import { hashPassword, ROLE } from '../src/lib/auth';

async function main() {
  const email = (process.env.ADMIN_EMAIL || 'admin@mvinspector.gov.in')
    .trim()
    .toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'admin123';
  const name = process.env.ADMIN_NAME || 'Super Admin';

  const existing = await db.user.findUnique({ where: { email } });

  if (existing) {
    console.log(`✓ Admin user already exists: ${email} (role: ${existing.role})`);
    return;
  }

  const passwordHash = await hashPassword(password);
  const user = await db.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: ROLE.ADMIN,
    },
    select: { id: true, email: true, name: true, role: true },
  });

  console.log('✓ Super Admin created:');
  console.log('   Email   :', user.email);
  console.log('   Name    :', user.name);
  console.log('   Role    :', user.role);
  console.log('   Password: (set via ADMIN_PASSWORD env var, default: admin123)');
  console.log('');
  console.log('⚠️  Change the default password immediately after first login.');
}

main()
  .catch((error) => {
    console.error('✗ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
