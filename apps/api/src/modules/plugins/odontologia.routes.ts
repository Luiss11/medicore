import { FastifyInstance } from 'fastify'
import { requireAuth, requirePlugin } from '../../middleware/auth.middleware'
import { prisma } from '@medicore/database'

export default async function odontologiaRoutes(app: FastifyInstance) {

  // GET /plugins/odontologia/:patientId
  app.get('/:patientId', {
    preHandler: [requireAuth, requirePlugin('odontologia')],
    handler: async (request, reply) => {
      const { tenantId } = request.tenant
      const { patientId } = request.params as any

      const records = await prisma.odontogramRecord.findMany({
        where: { patientId },
        orderBy: [{ toothNumber: 'asc' }, { recordedAt: 'desc' }],
      })

      // Verify patient belongs to tenant
      const patient = await prisma.patient.findFirst({
        where: { id: patientId, tenantId },
        select: { id: true, firstName: true, lastName: true },
      })
      if (!patient) return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Paciente no encontrado' } })

      return reply.send({ success: true, data: { patient, records } })
    },
  })

  // POST /plugins/odontologia/:patientId — save/update tooth surface
  app.post('/:patientId', {
    preHandler: [requireAuth, requirePlugin('odontologia')],
    schema: {
      body: {
        type: 'object',
        required: ['toothNumber', 'condition'],
        properties: {
          toothNumber: { type: 'number' },
          surface:     { type: 'string' },
          condition:   { type: 'string' },
          material:    { type: 'string' },
          notes:       { type: 'string' },
        },
      },
    },
    handler: async (request, reply) => {
      const { tenantId } = request.tenant
      const { patientId } = request.params as any
      const { toothNumber, surface, condition, material, notes } = request.body as any

      const patient = await prisma.patient.findFirst({ where: { id: patientId, tenantId } })
      if (!patient) return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Paciente no encontrado' } })

      // Upsert: if record exists for tooth+surface, update it
      const existing = await prisma.odontogramRecord.findFirst({
        where: { patientId, toothNumber, surface: surface ?? null },
      })

      let record
      if (existing) {
        record = await prisma.odontogramRecord.update({
          where: { id: existing.id },
          data: { condition, material, notes },
        })
      } else {
        record = await prisma.odontogramRecord.create({
          data: { patientId, toothNumber, surface, condition, material, notes },
        })
      }

      return reply.send({ success: true, data: record })
    },
  })

  // DELETE /plugins/odontologia/record/:recordId
  app.delete('/record/:recordId', {
    preHandler: [requireAuth, requirePlugin('odontologia')],
    handler: async (request, reply) => {
      const { recordId } = request.params as any
      await prisma.odontogramRecord.delete({ where: { id: recordId } })
      return reply.send({ success: true, data: { message: 'Registro eliminado' } })
    },
  })
}
