import { prisma } from '@medicore/database'
import type { PaginationQuery } from '@medicore/shared'

// ─────────────────────────────────────────────
// PatientService
// All methods receive tenantId as first param.
// This enforces data isolation between tenants.
// ─────────────────────────────────────────────

export class PatientService {
  /**
   * List patients with search + pagination.
   * Scoped to tenantId — ALWAYS.
   */
  async findAll(tenantId: string, query: PaginationQuery & { search?: string }) {
    const { page = 1, limit = 20, search, order = 'asc', orderBy = 'lastName' } = query
    const skip = (page - 1) * limit

    const where = {
      tenantId,
      isActive: true,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search } },
        ],
      }),
    }

    const [data, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [orderBy]: order },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          gender: true,
          phone: true,
          email: true,
          bloodType: true,
          allergies: true,
          createdAt: true,
          _count: { select: { appointments: true } },
        },
      }),
      prisma.patient.count({ where }),
    ])

    const totalPages = Math.ceil(total / limit)
    return {
      data,
      meta: { total, page, limit, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
    }
  }

  /**
   * Get full patient profile by ID.
   * Verifies tenantId to prevent cross-tenant access.
   */
  async findById(tenantId: string, id: string) {
    return prisma.patient.findFirst({
      where: { id, tenantId, isActive: true },
      include: {
        _count: { select: { appointments: true, clinicalNotes: true } },
      },
    })
  }

  /**
   * Create a new patient under the tenant.
   */
  async create(tenantId: string, dto: CreatePatientDto) {
    return prisma.patient.create({
      data: { ...dto, tenantId },
    })
  }

  /**
   * Partial update. Cannot change tenantId.
   */
  async update(tenantId: string, id: string, dto: UpdatePatientDto) {
    // Verify ownership before update
    await this.findByIdOrThrow(tenantId, id)
    return prisma.patient.update({
      where: { id },
      data: dto,
    })
  }

  /**
   * Soft delete — sets isActive = false.
   * We never hard-delete medical records.
   */
  async softDelete(tenantId: string, id: string) {
    await this.findByIdOrThrow(tenantId, id)
    return prisma.patient.update({
      where: { id },
      data: { isActive: false },
    })
  }

  async getAppointments(tenantId: string, patientId: string) {
    await this.findByIdOrThrow(tenantId, patientId)
    return prisma.appointment.findMany({
      where: { tenantId, patientId },
      include: {
        doctor: { select: { firstName: true, lastName: true, specialty: true } },
        treatments: { include: { treatment: { select: { name: true } } } },
        payment: { select: { status: true, total: true } },
      },
      orderBy: { scheduledAt: 'desc' },
    })
  }

  async getClinicalHistory(tenantId: string, patientId: string) {
    await this.findByIdOrThrow(tenantId, patientId)
    return prisma.clinicalNote.findMany({
      where: { tenantId, patientId },
      include: {
        doctor: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  // ── Private helpers ───────────────────────────

  private async findByIdOrThrow(tenantId: string, id: string) {
    const patient = await prisma.patient.findFirst({ where: { id, tenantId } })
    if (!patient) throw Object.assign(new Error('Patient not found'), { statusCode: 404 })
    return patient
  }
}

// ── DTOs ──────────────────────────────────────

interface CreatePatientDto {
  firstName: string
  lastName: string
  dateOfBirth?: Date
  gender?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  bloodType?: string
  allergies?: string
  chronicConditions?: string
  currentMedications?: string
  emergencyContact?: string
  emergencyContactPhone?: string
  notes?: string
}

type UpdatePatientDto = Partial<CreatePatientDto>
