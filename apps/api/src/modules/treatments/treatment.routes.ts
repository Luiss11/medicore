import { FastifyInstance } from 'fastify'
import { requireAuth } from '../../middleware/auth.middleware'
import { prisma } from '@medicore/database'

export default async function treatmentRoutes(app: FastifyInstance) {

  app.get('/', {
    preHandler: [requireAuth],
    handler: async (request, reply) => {
      const { tenantId } = request.tenant
      const treatments = await prisma.treatment.findMany({
        where: { tenantId, isActive: true },
        orderBy: { name: 'asc' },
      })
      return reply.send({ success: true, data: treatments })
    },
  })
}