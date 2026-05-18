import { FastifyInstance } from 'fastify'
import { requireAuth } from '../../middleware/auth.middleware'
import { prisma } from '@medicore/database'

export default async function dashboardRoutes(app: FastifyInstance) {

  // GET /api/v1/dashboard/stats
  app.get('/stats', {
    preHandler: [requireAuth],
    handler: async (request, reply) => {
      const { tenantId } = request.tenant
      const now   = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      const [
        citasHoy,
        citasPendientes,
        pacientesActivos,
        ingresosMes,
        stockBajo,
        proximasCitas,
      ] = await Promise.all([
        // Citas de hoy
        prisma.appointment.count({
          where: { tenantId, scheduledAt: { gte: today, lt: tomorrow } },
        }),
        // Citas pendientes (programadas)
        prisma.appointment.count({
          where: { tenantId, status: 'SCHEDULED', scheduledAt: { gte: today } },
        }),
        // Pacientes activos
        prisma.patient.count({
          where: { tenantId, isActive: true },
        }),
        // Ingresos del mes
        prisma.payment.aggregate({
          where: { tenantId, status: 'PAID', paidAt: { gte: monthStart } },
          _sum: { total: true },
        }),
        // Items con stock bajo
        prisma.inventoryItem.count({
          where: { tenantId, isActive: true, quantity: { lte: prisma.inventoryItem.fields.minQuantity } },
        }).catch(() => 0),
        // Próximas 5 citas del día
        prisma.appointment.findMany({
          where: { tenantId, scheduledAt: { gte: today, lt: tomorrow } },
          orderBy: { scheduledAt: 'asc' },
          take: 5,
          include: {
            patient: { select: { firstName: true, lastName: true } },
            doctor:  { select: { firstName: true, lastName: true, specialty: true } },
          },
        }),
      ])

      return reply.send({
        success: true,
        data: {
          citasHoy,
          citasPendientes,
          pacientesActivos,
          ingresosMes: Number(ingresosMes._sum.total ?? 0),
          stockBajo: typeof stockBajo === 'number' ? stockBajo : 0,
          proximasCitas,
        },
      })
    },
  })
}
