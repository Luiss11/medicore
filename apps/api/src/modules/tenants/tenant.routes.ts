import { FastifyInstance } from 'fastify'

export default async function tenantsRoutes(app: FastifyInstance) {
  app.get('/', async () => ({ success: true, data: { message: 'tenants module coming soon' } }))
}
