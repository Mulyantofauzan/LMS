import { db } from './index';
import { 
  users, 
  settings, 
  jobsites, 
  trainings, 
  trainingSessions, 
  enrollments, 
  attendance, 
  questionBank, 
  exams, 
  certificates, 
  approvals, 
  auditLogs,
  trainingMaterials
} from './schema';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('Seeding database...');
  
  try {
    const passwordHash = await bcrypt.hash('password123', 10);
    
    // Clear existing data
    await db.delete(auditLogs);
    await db.delete(approvals);
    await db.delete(certificates);
    await db.delete(attendance);
    await db.delete(enrollments);
    await db.delete(trainingSessions);
    await db.delete(trainingMaterials);
    await db.delete(trainings);
    await db.delete(users);
    await db.delete(jobsites);
    await db.delete(settings);
    
    // 1. Seed Jobsites
    const site1 = await db.insert(jobsites).values({
      name: 'Tambang Alpha',
      location: 'Kalimantan Timur',
      settings: { timezone: 'WITA' }
    }).returning({ id: jobsites.id });
    
    const site2 = await db.insert(jobsites).values({
      name: 'Pabrik Beta',
      location: 'Jawa Barat',
      settings: { timezone: 'WIB' }
    }).returning({ id: jobsites.id });

    // 2. Seed Users
    const uSuperAdmin = await db.insert(users).values({
      name: 'Super Admin',
      email: 'superadmin@demo.com',
      passwordHash,
      role: 'super-admin'
    }).returning({ id: users.id });

    const uSiteAdmin = await db.insert(users).values({
      name: 'Site Admin Alpha',
      email: 'siteadmin@demo.com',
      passwordHash,
      role: 'site-admin',
      jobsiteId: site1[0].id
    }).returning({ id: users.id });

    const uManager = await db.insert(users).values({
      name: 'Manager Operasional',
      email: 'manager@demo.com',
      passwordHash,
      role: 'manager',
      department: 'Operations',
      jobsiteId: site1[0].id
    }).returning({ id: users.id });

    const uTrainer = await db.insert(users).values({
      name: 'Trainer Ahli',
      email: 'trainer@demo.com',
      passwordHash,
      role: 'trainer',
      department: 'HSE',
      jobsiteId: site1[0].id
    }).returning({ id: users.id });

    const uTrainee = await db.insert(users).values({
      name: 'Trainee Junior',
      email: 'trainee@demo.com',
      passwordHash,
      role: 'trainee',
      department: 'Operations',
      position: 'Operator',
      jobsiteId: site1[0].id
    }).returning({ id: users.id });

    // 3. Seed Trainings
    const training1 = await db.insert(trainings).values({
      title: 'Keselamatan Kerja Dasar (HSE Basic)',
      description: 'Pelatihan wajib untuk semua karyawan baru di area operasional.',
      category: 'HSE',
      type: 'offline',
      isMandatory: true,
      jobsiteId: site1[0].id
    }).returning({ id: trainings.id });

    const training2 = await db.insert(trainings).values({
      title: 'Pengoperasian Alat Berat',
      description: 'Pelatihan khusus untuk operator alat berat (Excavator).',
      category: 'Teknis',
      type: 'offline',
      isMandatory: false,
      jobsiteId: site1[0].id
    }).returning({ id: trainings.id });

    // 4. Seed Training Materials
    await db.insert(trainingMaterials).values([
      {
        trainingId: training1[0].id,
        title: 'Buku Panduan HSE',
        type: 'pdf',
        fileUrl: '/uploads/dummy_hse_guide.pdf'
      },
      {
        trainingId: training1[0].id,
        title: 'Video Edukasi Safety',
        type: 'video',
        fileUrl: '/uploads/dummy_safety_video.mp4'
      }
    ]);

    // 5. Seed Training Sessions
    const now = new Date();
    const session1 = await db.insert(trainingSessions).values({
      trainingId: training1[0].id,
      trainerId: uTrainer[0].id,
      startTime: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      endTime: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      location: 'Ruang Training A'
    }).returning({ id: trainingSessions.id });

    const session2 = await db.insert(trainingSessions).values({
      trainingId: training2[0].id,
      trainerId: uTrainer[0].id,
      startTime: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days in future
      endTime: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000),
      location: 'Area Lapangan'
    }).returning({ id: trainingSessions.id });

    // 6. Seed Enrollments
    await db.insert(enrollments).values([
      {
        sessionId: session1[0].id,
        traineeId: uTrainee[0].id,
        status: 'completed'
      },
      {
        sessionId: session2[0].id,
        traineeId: uTrainee[0].id,
        status: 'enrolled'
      }
    ]);

    // 7. Seed Attendance
    await db.insert(attendance).values({
      sessionId: session1[0].id,
      traineeId: uTrainee[0].id,
      checkIn: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      checkOut: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      method: 'qr',
      status: 'present'
    });

    // 8. Seed Certificates
    await db.insert(certificates).values({
      userId: uTrainee[0].id,
      trainingId: training1[0].id,
      certNumber: 'CERT-HSE-2026-001',
      issueDate: new Date(),
      expiryDate: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000) // 1 year validity
    });

    // 9. Seed Approvals
    await db.insert(approvals).values({
      traineeId: uTrainee[0].id,
      trainingId: training2[0].id,
      managerId: uManager[0].id,
      status: 'pending'
    });

    // 10. Seed Audit Logs
    await db.insert(auditLogs).values({
      userId: uSuperAdmin[0].id,
      action: 'SYSTEM_SETUP',
      target: 'ALL',
      timestamp: new Date()
    });

    // 11. Seed Settings (Hero)
    await db.insert(settings).values([
      { key: 'heroTitle', value: 'Berdayakan Tim Anda' },
      { key: 'heroSubtitle', value: 'Sistem Manajemen Pembelajaran terdepan yang dirancang untuk industri modern.' }
    ]);

    console.log('Seeding complete! (Generated full dataset)');
  } catch (error) {
    console.log('Database might already be seeded or an error occurred:', error);
  }
}

main();
