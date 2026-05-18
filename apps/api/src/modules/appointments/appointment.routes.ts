import { FastifyInstance } from 'fastify'
import { requireAuth } from '../../middleware/auth.middleware'
import { prisma } from '@medicore/database'

export default async function appointmentRoutes(app: FastifyInstance) {

  // GET /appointments?from=&to=&doctorId=&status=
  app.get('/', {
    preHandler: [requireAuth],
    handler: async (request, reply) => {
      const { tenantId } = request.tenant
      const { from, to, doctorId, status, page = '1', limit = '50' } = request.query as any

      const where: any = { tenantId }
      if (from || to) {
        where.scheduledAt = {}
        if (from) where.scheduledAt.gte = new Date(from)
        if (to)   where.scheduledAt.lte = new Date(to)
      }
      if (doctorId) where.doctorId = doctorId
      if (status)   where.status   = status

      const skip  = (parseInt(page) - 1) * parseInt(limit)
      const [data, total] = await Promise.all([
        prisma.appointment.findMany({
          where, skip, take: parseInt(limit),
          orderBy: { scheduledAt: 'asc' },
          include: {
            patient: { select: { id: true, firstName: true, lastName: true, phone: true } },
            doctor:  { select: { id: true, firstName: true, lastName: true, specialty: true } },
            treatments: { include: { treatment: { select: { name: true } } } },
            payment: { select: { status: true, total: true } },
          },
        }),
        prisma.appointment.count({ where }),
      ])

      const totalPages = Math.ceil(total / parseInt(limit))
      return reply.send({
        success: true, data,
        meta: { total, page: parseInt(page), limit: parseInt(limit), totalPages },
      })
    },
  })

  // GET /appointments/:id
  app.get('/:id', {
    preHandler: [requireAuth],
    handler: async (request, reply) => {
      const { tenantId } = request.tenant
      const { id } = request.params as any
      const appt = await prisma.appointment.findFirst({
        where: { id, tenantId },
        include: {
          patient: true,
          doctor:  true,
          treatments: { include: { treatment: true } },
          payment: true,
          clinicalNote: true,
        },
      })
      if (!appt) return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Cita no encontrada' } })
      return reply.send({ success: true, data: appt })
    },
  })

  // POST /appointments
  app.post('/', {
    preHandler: [requireAuth],
    schema: {
      body: {
        type: 'object',
        required: ['patientId', 'doctorId', 'scheduledAt'],
        properties: {
          patientId:   { type: 'string' },
          doctorId:    { type: 'string' },
          scheduledAt: { type: 'string' },
          durationMin: { type: 'number' },
          reason:      { type: 'string' },
          notes:       { type: 'string' },
          treatmentIds: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    handler: async (request, reply) => {
      const { tenantId } = request.tenant
      const { patientId, doctorId, scheduledAt, durationMin = 30, reason, notes, treatmentIds = [] } = request.body as any

      // Check for scheduling conflicts
      const scheduledDate = new Date(scheduledAt)
      const endDate = new Date(scheduledDate.getTime() + durationMin * 60 * 1000)

      const conflict = await prisma.appointment.findFirst({
        where: {
          tenantId, doctorId,
          status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
          scheduledAt: { lt: endDate },
          AND: [{
            scheduledAt: {
              gte: new Date(scheduledDate.getTime() - durationMin * 60 * 1000)
            }
          }],
        },
      })

      if (conflict) {
        return reply.status(409).send({
          success: false,
          error: { code: 'SCHEDULE_CONFLICT', message: 'El doctor ya tiene una cita en ese horario' },
        })
      }

      // Get treatment prices
      let treatments: any[] = []
      if (treatmentIds.length > 0) {
        treatments = await prisma.treatment.findMany({
          where: { id: { in: treatmentIds }, tenantId },
        })
      }

      const appt = await prisma.appointment.create({
        data: {
          tenantId, patientId, doctorId,
          scheduledAt: scheduledDate,
          durationMin, reason, notes,
          treatments: {
            create: treatments.map(t => ({
              treatmentId: t.id,
              appliedPrice: t.basePrice,
            })),
          },
        },
        include: {
          patient: { select: { firstName: true, lastName: true } },
          doctor:  { select: { firstName: true, lastName: true } },
          treatments: { include: { treatment: { select: { name: true } } } },
        },
      })

      return reply.status(201).send({ success: true, data: appt })
    },
  })

  // PATCH /appointments/:id/status
  app.patch('/:id/status', {
    preHandler: [requireAuth],
    handler: async (request, reply) => {
      const { tenantId } = request.tenant
      const { id }      = request.params as any
      const { status }  = request.body as any

      const appt = await prisma.appointment.findFirst({ where: { id, tenantId } })
      if (!appt) return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Cita no encontrada' } })

      const updated = await prisma.appointment.update({
        where: { id },
        data: { status },
      })
      return reply.send({ success: true, data: updated })
    },
  })

  // DELETE /appointments/:id (soft — cancel)
  app.delete('/:id', {
    preHandler: [requireAuth],
    handler: async (request, reply) => {
      const { tenantId } = request.tenant
      const { id }      = request.params as any
      await prisma.appointment.updateMany({
        where: { id, tenantId },
        data: { status: 'CANCELLED' },
      })
      return reply.send({ success: true, data: { message: 'Cita cancelada' } })
    },
  })
}
