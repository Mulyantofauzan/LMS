import { db } from './index';
import { users, settings } from './schema';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Seeding database...');
  
  try {
    const passwordHash = await bcrypt.hash('password123', 10);
    
    await db.insert(users).values([
      {
        name: 'Admin User',
        email: 'admin@demo.com',
        passwordHash,
        role: 'admin',
      },
      {
        name: 'Trainer User',
        email: 'trainer@demo.com',
        passwordHash,
        role: 'trainer',
      },
      {
        name: 'Trainee User',
        email: 'trainee@demo.com',
        passwordHash,
        role: 'trainee',
      }
    ]);

    await db.insert(settings).values([
      { key: 'heroTitle', value: 'Empower Your Learning Journey' },
      { key: 'heroSubtitle', value: 'The next-generation Learning Management System designed for modern teams. Accessible, fast, and secure.' }
    ]);

    console.log('Seeding complete!');
  } catch (error) {
    console.log('Database might already be seeded or an error occurred:', error);
  }
}

main();
