import { FastifyInstance } from 'fastify'
import { AuthService } from './auth.service'
import { requireAuth } from '../../middleware/auth.middleware'

const loginSchema = {
  body: {
    type: 'object',
    required: ['email', 'password', 'tenantSlug'],
    properties: {
      email:      { type: 'string' },
      password:   { type: 'string', minLength: 6 },
      tenantSlug: { type: 'string' },
    },
  },
}

export default async function authRoutes(app: FastifyInstance) {
  const service = new AuthService()

  app.post('/login', {
    schema: loginSchema,
    handler: async (request, reply) => {
      const { email, password, tenantSlug } = request.body as {
        email: string; password: string; tenantSlug: string
      }
      const result = await service.login(email, password, tenantSlug)
      const accessToken = app.jwt.sign({
        sub: result.user.id,
        tenantId: result.tenant.id,
        role: result.user.role,
        email: result.user.email,
      })
      return reply.send({
        success: true,
        data: { accessToken, refreshToken: result.refreshToken, expiresIn: 604800, user: result.user, tenant: result.tenant },
      })
    },
  })

  app.post('/refresh', {
    schema: { body: { type: 'object', required: ['refreshToken'], properties: { refreshToken: { type: 'string' } } } },
    handler: async (request, reply) => {
      const { refreshToken } = request.body as { refreshToken: string }
      const result = await service.refresh(refreshToken)
      const accessToken = app.jwt.sign({
        sub: result.user.id, tenantId: result.tenant.id, role: result.user.role, email: result.user.email,
      })
      return reply.send({ success: true, data: { accessToken, expiresIn: 604800 } })
    },
  })

  app.post('/logout', {
    schema: { body: { type: 'object', required: ['refreshToken'], properties: { refreshToken: { type: 'string' } } } },
    handler: async (request, reply) => {
      const { refreshToken } = request.body as { refreshToken: string }
      await service.logout(refreshToken)
      return reply.send({ success: true, data: { message: 'Sesión cerrada correctamente' } })
    },
  })

  app.get('/me', {
    preHandler: [requireAuth],
    handler: async (request, reply) => {
      const user = await service.getMe(request.user.sub, request.tenant.tenantId)
      return reply.send({ success: true, data: user })
    },
  })
}