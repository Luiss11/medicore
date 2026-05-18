import { FastifyInstance } from 'fastify'
import { requireAuth } from '../../middleware/auth.middleware'
import { prisma } from '@medicore/database'

export default async function paymentRoutes(app: FastifyInstance) {

  // GET /payments?status=&from=&to=&page=
  app.get('/', {
    preHandler: [requireAuth],
    handler: async (request, reply) => {
      const { tenantId } = request.tenant
      const { status, from, to, page = '1', limit = '20' } = request.query as any
      const skip = (parseInt(page) - 1) * parseInt(limit)

      const where: any = { tenantId }
      if (status) where.status = status
      if (from || to) {
        where.createdAt = {}
        if (from) where.createdAt.gte = new Date(from)
        if (to)   where.createdAt.lte = new Date(to)
      }

      const [data, total, summary] = await Promise.all([
        prisma.payment.findMany({
          where, skip, take: parseInt(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            patient:     { select: { firstName: true, lastName: true } },
            appointment: { select: { scheduledAt: true, doctor: { select: { firstName: true, lastName: true } } } },
          },
        }),
        prisma.payment.count({ where }),
        prisma.payment.aggregate({
          where: { tenantId },
          _sum: { total: true },
        }),
      ])

      const paid    = await prisma.payment.aggregate({ where: { tenantId, status: 'PAID' },    _sum: { total: true } })
      const pending = await prisma.payment.aggregate({ where: { tenantId, status: 'PENDING' }, _sum: { total: true } })

      return reply.send({
        success: true, data,
        meta: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) },
        summary: {
          totalGeneral: Number(summary._sum.total ?? 0),
          totalPaid:    Number(paid._sum.total    ?? 0),
          totalPending: Number(pending._sum.total ?? 0),
        },
      })
    },
  })

  // GET /payments/:id
  app.get('/:id', {
    preHandler: [requireAuth],
    handler: async (request, reply) => {
      const { tenantId } = request.tenant
      const { id } = request.params as any
      const payment = await prisma.payment.findFirst({
        where: { id, tenantId },
        include: {
          patient: true,
          appointment: {
            include: {
              doctor:     { select: { firstName: true, lastName: true, specialty: true } },
              treatments: { include: { treatment: { select: { name: true, basePrice: true } } } },
            },
          },
        },
      })
      if (!payment) return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Pago no encontrado' } })
      return reply.send({ success: true, data: payment })
    },
  })

  // POST /payments
  app.post('/', {
    preHandler: [requireAuth],
    schema: {
      body: {
        type: 'object',
        required: ['patientId', 'amount', 'total'],
        properties: {
          patientId:     { type: 'string' },
          appointmentId: { type: 'string' },
          amount:        { type: 'number' },
          discount:      { type: 'number' },
          total:         { type: 'number' },
          method:        { type: 'string' },
          status:        { type: 'string' },
          notes:         { type: 'string' },
          reference:     { type: 'string' },
        },
      },
    },
    handler: async (request, reply) => {
      const { tenantId } = request.tenant
      const body = request.body as any

      const payment = await prisma.payment.create({
        data: {
          tenantId,
          patientId:     body.patientId,
          appointmentId: body.appointmentId,
          amount:        body.amount,
          discount:      body.discount ?? 0,
          total:         body.total,
          method:        body.method   ?? 'CASH',
          status:        body.status   ?? 'PAID',
          notes:         body.notes,
          reference:     body.reference,
          paidAt:        body.status !== 'PENDING' ? new Date() : null,
        },
        include: {
          patient: { select: { firstName: true, lastName: true } },
        },
      })

      return reply.status(201).send({ success: true, data: payment })
    },
  })

  // PATCH /payments/:id
  app.patch('/:id', {
    preHandler: [requireAuth],
    handler: async (request, reply) => {
      const { tenantId } = request.tenant
      const { id }  = request.params as any
      const body    = request.body as any

      const existing = await prisma.payment.findFirst({ where: { id, tenantId } })
      if (!existing) return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Pago no encontrado' } })

      const updated = await prisma.payment.update({
        where: { id },
        data: {
          ...body,
          paidAt: body.status === 'PAID' && !existing.paidAt ? new Date() : existing.paidAt,
        },
      })
      return reply.send({ success: true, data: updated })
    },
  })
}
