import { db } from './index';
import { users } from './schema';
import bcrypt from 'bcryptjs';

async function main() {
  try {
    const passwordHash = await bcrypt.hash('password123', 10);
    await db.insert(users).values([
      { name: 'Super Admin', email: 'superadmin@demo.com', passwordHash, role: 'super-admin' },
      { name: 'Site Admin', email: 'siteadmin@demo.com', passwordHash, role: 'site-admin' },
      { name: 'Manager', email: 'manager@demo.com', passwordHash, role: 'manager' }
    ]);
    console.log('Seeded new roles');
  } catch (e) { console.log(e); }
}
main();
