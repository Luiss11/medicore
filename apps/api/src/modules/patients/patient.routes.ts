import { FastifyInstance } from 'fastify'
import { requireAuth } from '../../middleware/auth.middleware'
import { PatientService } from './patient.service'
import { createPatientSchema, updatePatientSchema, patientQuerySchema } from './patient.schema'

// ─────────────────────────────────────────────
// Patient Routes
// All routes require authentication.
// All queries are automatically scoped to the
// authenticated user's tenant (multi-tenant).
// ─────────────────────────────────────────────

export default async function patientRoutes(app: FastifyInstance) {
  const service = new PatientService()

  // ── GET /patients ───────────────────────────
  app.get('/', {
    preHandler: [requireAuth],
    schema: { querystring: patientQuerySchema },
    handler: async (request, reply) => {
      const { tenantId } = request.tenant
      const result = await service.findAll(tenantId, request.query as any)
      return reply.send({ success: true, ...result })
    },
  })

  // ── GET /patients/:id ───────────────────────
  app.get('/:id', {
    preHandler: [requireAuth],
    handler: async (request, reply) => {
      const { tenantId } = request.tenant
      const { id } = request.params as { id: string }
      const patient = await service.findById(tenantId, id)
      if (!patient) return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Patient not found' } })
      return reply.send({ success: true, data: patient })
    },
  })

  // ── POST /patients ──────────────────────────
  app.post('/', {
    preHandler: [requireAuth],
    schema: { body: createPatientSchema },
    handler: async (request, reply) => {
      const { tenantId } = request.tenant
      const patient = await service.create(tenantId, request.body as any)
      return reply.status(201).send({ success: true, data: patient })
    },
  })

  // ── PATCH /patients/:id ─────────────────────
  app.patch('/:id', {
    preHandler: [requireAuth],
    schema: { body: updatePatientSchema },
    handler: async (request, reply) => {
      const { tenantId } = request.tenant
      const { id } = request.params as { id: string }
      const patient = await service.update(tenantId, id, request.body as any)
      return reply.send({ success: true, data: patient })
    },
  })

  // ── DELETE /patients/:id ────────────────────
  app.delete('/:id', {
    preHandler: [requireAuth],
    handler: async (request, reply) => {
      const { tenantId } = request.tenant
      const { id } = request.params as { id: string }
      await service.softDelete(tenantId, id)
      return reply.send({ success: true, data: { message: 'Patient deactivated' } })
    },
  })

  // ── GET /patients/:id/appointments ──────────
  app.get('/:id/appointments', {
    preHandler: [requireAuth],
    handler: async (request, reply) => {
      const { tenantId } = request.tenant
      const { id } = request.params as { id: string }
      const appointments = await service.getAppointments(tenantId, id)
      return reply.send({ success: true, data: appointments })
    },
  })

  // ── GET /patients/:id/clinical-history ──────
  app.get('/:id/clinical-history', {
    preHandler: [requireAuth],
    handler: async (request, reply) => {
      const { tenantId } = request.tenant
      const { id } = request.params as { id: string }
      const history = await service.getClinicalHistory(tenantId, id)
      return reply.send({ success: true, data: history })
    },
  })
}
