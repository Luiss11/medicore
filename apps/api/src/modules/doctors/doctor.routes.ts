import { FastifyInstance } from 'fastify'
import { requireAuth } from '../../middleware/auth.middleware'
import { prisma } from '@medicore/database'

export default async function doctorRoutes(app: FastifyInstance) {

  app.get('/', {
    preHandler: [requireAuth],
    handler: async (request, reply) => {
      const { tenantId } = request.tenant
      const doctors = await prisma.doctor.findMany({
        where: { tenantId, isActive: true },
        orderBy: { lastName: 'asc' },
      })
      return reply.send({ success: true, data: doctors })
    },
  })
}
