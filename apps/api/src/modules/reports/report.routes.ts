import { FastifyInstance } from 'fastify'
import { requireAuth } from '../../middleware/auth.middleware'
import { prisma } from '@medicore/database'

export default async function reportRoutes(app: FastifyInstance) {

  // GET /reports/overview — main KPIs
  app.get('/overview', {
    preHandler: [requireAuth],
    handler: async (request, reply) => {
      const { tenantId } = request.tenant
      const now        = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonth  = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

      const [
        totalPatients, newPatientsMonth, newPatientsLast,
        citasMonth, citasLast,
        ingresosMonth, ingresosLast,
        citasPorEstado,
      ] = await Promise.all([
        prisma.patient.count({ where: { tenantId, isActive: true } }),
        prisma.patient.count({ where: { tenantId, createdAt: { gte: monthStart } } }),
        prisma.patient.count({ where: { tenantId, createdAt: { gte: lastMonth, lte: lastMonthEnd } } }),
        prisma.appointment.count({ where: { tenantId, scheduledAt: { gte: monthStart } } }),
        prisma.appointment.count({ where: { tenantId, scheduledAt: { gte: lastMonth, lte: lastMonthEnd } } }),
        prisma.payment.aggregate({ where: { tenantId, status: 'PAID', paidAt: { gte: monthStart } }, _sum: { total: true } }),
        prisma.payment.aggregate({ where: { tenantId, status: 'PAID', paidAt: { gte: lastMonth, lte: lastMonthEnd } }, _sum: { total: true } }),
        prisma.appointment.groupBy({ by: ['status'], where: { tenantId }, _count: true }),
      ])

      const pct = (curr: number, prev: number) =>
        prev === 0 ? 100 : Math.round(((curr - prev) / prev) * 100)

      return reply.send({
        success: true,
        data: {
          totalPatients,
          newPatientsMonth,
          newPatientsPct: pct(newPatientsMonth, newPatientsLast),
          citasMonth,
          citasPct: pct(citasMonth, citasLast),
          ingresosMonth: Number(ingresosMonth._sum.total ?? 0),
          ingresosPct: pct(
            Number(ingresosMonth._sum.total ?? 0),
            Number(ingresosLast._sum.total ?? 0)
          ),
          citasPorEstado: citasPorEstado.map(c => ({ status: c.status, count: c._count })),
        },
      })
    },
  })

  // GET /reports/income?months=6 — monthly income for chart
  app.get('/income', {
    preHandler: [requireAuth],
    handler: async (request, reply) => {
      const { tenantId } = request.tenant
      const { months = '6' } = request.query as any
      const n = parseInt(months)
      const now = new Date()

      const data = []
      for (let i = n - 1; i >= 0; i--) {
        const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const end   = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)

        const [pagos, citas, pacientes] = await Promise.all([
          prisma.payment.aggregate({
            where: { tenantId, status: 'PAID', paidAt: { gte: start, lte: end } },
            _sum: { total: true },
          }),
          prisma.appointment.count({
            where: { tenantId, scheduledAt: { gte: start, lte: end } },
          }),
          prisma.patient.count({
            where: { tenantId, createdAt: { gte: start, lte: end } },
          }),
        ])

        data.push({
          month: start.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }),
          ingresos: Number(pagos._sum.total ?? 0),
          citas,
          pacientes,
        })
      }

      return reply.send({ success: true, data })
    },
  })

  // GET /reports/treatments — top treatments by usage and revenue
  app.get('/treatments', {
    preHandler: [requireAuth],
    handler: async (request, reply) => {
      const { tenantId } = request.tenant

      const results = await prisma.appointmentTreatment.groupBy({
        by: ['treatmentId'],
        where: { appointment: { tenantId } },
        _count: true,
        _sum: { appliedPrice: true },
        orderBy: { _count: { treatmentId: 'desc' } },
        take: 8,
      })

      const withNames = await Promise.all(
        results.map(async r => {
          const t = await prisma.treatment.findUnique({ where: { id: r.treatmentId } })
          return {
            name: t?.name ?? 'Desconocido',
            count: r._count,
            revenue: Number(r._sum.appliedPrice ?? 0),
          }
        })
      )

      return reply.send({ success: true, data: withNames })
    },
  })

  // GET /reports/doctors — appointments and income by doctor
  app.get('/doctors', {
    preHandler: [requireAuth],
    handler: async (request, reply) => {
      const { tenantId } = request.tenant
      const now = new Date()
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      const doctors = await prisma.doctor.findMany({
        where: { tenantId, isActive: true },
        include: {
          _count: { select: { appointments: true } },
        },
      })

      const data = await Promise.all(doctors.map(async d => {
        const citasMes = await prisma.appointment.count({
          where: { tenantId, doctorId: d.id, scheduledAt: { gte: monthStart } },
        })
        return {
          name: `Dr. ${d.firstName} ${d.lastName}`,
          specialty: d.specialty,
          totalCitas: d._count.appointments,
          citasMes,
        }
      }))

      return reply.send({ success: true, data })
    },
  })
}
