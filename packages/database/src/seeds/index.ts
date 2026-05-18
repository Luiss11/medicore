import { prisma, Plan, UserRole, Gender, BloodType } from '../index'
import * as bcrypt from 'bcryptjs'

// ─────────────────────────────────────────────
// Seed: Creates demo tenant + users for dev
// Run: pnpm db:seed
// ─────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding database...')

  // ── Demo Tenant: Dental Clinic ──────────────
  const dentalTenant = await prisma.tenant.upsert({
    where: { slug: 'clinica-sonrisa' },
    update: {},
    create: {
      name: 'Clínica Dental Sonrisa',
      slug: 'clinica-sonrisa',
      plan: Plan.CLINIC,
      email: 'admin@clinicasonrisa.mx',
      phone: '+52 618 123 4567',
      city: 'Durango',
      state: 'Durango',
      country: 'MX',
    },
  })
  console.log('  ✅ Tenant:', dentalTenant.name)

  // ── Activate dental plugin ──────────────────
  await prisma.tenantPlugin.upsert({
    where: { tenantId_pluginKey: { tenantId: dentalTenant.id, pluginKey: 'odontologia' } },
    update: {},
    create: {
      tenantId: dentalTenant.id,
      pluginKey: 'odontologia',
    },
  })

  // ── Admin User ──────────────────────────────
  const adminPass = await bcrypt.hash('Admin1234!', 12)
  const adminUser = await prisma.user.upsert({
    where: { email_tenantId: { email: 'admin@clinicasonrisa.mx', tenantId: dentalTenant.id } },
    update: {},
    create: {
      tenantId: dentalTenant.id,
      email: 'admin@clinicasonrisa.mx',
      name: 'Administrador',
      passwordHash: adminPass,
      role: UserRole.TENANT_ADMIN,
    },
  })
  console.log('  ✅ Admin user:', adminUser.email)

  // ── Doctor User ─────────────────────────────
  const doctorPass = await bcrypt.hash('Doctor1234!', 12)
  const doctorUser = await prisma.user.upsert({
    where: { email_tenantId: { email: 'dr.garcia@clinicasonrisa.mx', tenantId: dentalTenant.id } },
    update: {},
    create: {
      tenantId: dentalTenant.id,
      email: 'dr.garcia@clinicasonrisa.mx',
      name: 'Dr. Luis García',
      passwordHash: doctorPass,
      role: UserRole.DOCTOR,
    },
  })

  const doctor = await prisma.doctor.upsert({
    where: { userId: doctorUser.id },
    update: {},
    create: {
      tenantId: dentalTenant.id,
      userId: doctorUser.id,
      firstName: 'Luis',
      lastName: 'García Hernández',
      specialty: 'Odontología General',
      cedula: '1234567',
      consultationPrice: 400,
    },
  })

  // ── Doctor Schedule: Mon–Fri 9–18 ──────────
  for (let day = 1; day <= 5; day++) {
    await prisma.doctorSchedule.upsert({
      where: { doctorId_dayOfWeek: { doctorId: doctor.id, dayOfWeek: day } },
      update: {},
      create: { doctorId: doctor.id, dayOfWeek: day, startTime: '09:00', endTime: '18:00', slotMinutes: 30 },
    })
  }
  console.log('  ✅ Doctor:', `${doctor.firstName} ${doctor.lastName}`)

  // ── Sample Patients ──────────────────────────
  const patients = await Promise.all([
    prisma.patient.create({
      data: {
        tenantId: dentalTenant.id,
        firstName: 'María',
        lastName: 'López Ramírez',
        dateOfBirth: new Date('1990-05-15'),
        gender: Gender.FEMALE,
        phone: '+52 618 555 0001',
        email: 'maria.lopez@email.com',
        bloodType: BloodType.O_POS,
        allergies: 'Penicilina',
      },
    }),
    prisma.patient.create({
      data: {
        tenantId: dentalTenant.id,
        firstName: 'Carlos',
        lastName: 'Martínez Torres',
        dateOfBirth: new Date('1985-11-20'),
        gender: Gender.MALE,
        phone: '+52 618 555 0002',
        bloodType: BloodType.A_POS,
      },
    }),
  ])
  console.log(`  ✅ Patients: ${patients.length} created`)

  // ── Treatment Catalog ───────────────────────
  const treatments = await prisma.treatment.createMany({
    data: [
      { tenantId: dentalTenant.id, name: 'Consulta General', basePrice: 400, durationMin: 30, category: 'Diagnóstico' },
      { tenantId: dentalTenant.id, name: 'Limpieza Dental', basePrice: 600, durationMin: 45, category: 'Preventivo' },
      { tenantId: dentalTenant.id, name: 'Extracción Simple', basePrice: 800, durationMin: 30, category: 'Cirugía', pluginKey: 'odontologia' },
      { tenantId: dentalTenant.id, name: 'Resina Fotopolimerizable', basePrice: 700, durationMin: 45, category: 'Restaurativo', pluginKey: 'odontologia' },
      { tenantId: dentalTenant.id, name: 'Endodoncia', basePrice: 3500, durationMin: 90, category: 'Endodoncia', pluginKey: 'odontologia' },
      { tenantId: dentalTenant.id, name: 'Corona Cerámica', basePrice: 8000, durationMin: 60, category: 'Prótesis', pluginKey: 'odontologia' },
    ],
    skipDuplicates: true,
  })
  console.log(`  ✅ Treatments: ${treatments.count} created`)

  // ── Sample Inventory ─────────────────────────
  await prisma.inventoryItem.createMany({
    data: [
      { tenantId: dentalTenant.id, name: 'Guantes de latex (caja)', quantity: 10, minQuantity: 3, unit: 'caja', unitPrice: 120, category: 'CONSUMABLE' },
      { tenantId: dentalTenant.id, name: 'Mascarillas quirúrgicas', quantity: 5, minQuantity: 2, unit: 'caja', unitPrice: 80, category: 'CONSUMABLE' },
      { tenantId: dentalTenant.id, name: 'Resina fotopolimerizable A2', quantity: 3, minQuantity: 2, unit: 'jeringa', unitPrice: 350, category: 'CONSUMABLE' },
      { tenantId: dentalTenant.id, name: 'Anestesia local (lidocaína)', quantity: 50, minQuantity: 20, unit: 'cartucho', unitPrice: 25, category: 'MEDICATION' },
    ],
    skipDuplicates: true,
  })
  console.log('  ✅ Inventory seeded')

  console.log('\n🎉 Seed complete!\n')
  console.log('  Demo credentials:')
  console.log('  Admin: admin@clinicasonrisa.mx / Admin1234!')
  console.log('  Doctor: dr.garcia@clinicasonrisa.mx / Doctor1234!')
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
