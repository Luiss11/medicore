import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import jwt from '@fastify/jwt'
import { prisma } from '@medicore/database'
import { env } from './config/env'
import { logger } from './config/logger'

import authRoutes        from './modules/auth/auth.routes'
import tenantRoutes      from './modules/tenants/tenant.routes'
import patientRoutes     from './modules/patients/patient.routes'
import doctorRoutes      from './modules/doctors/doctor.routes'
import appointmentRoutes from './modules/appointments/appointment.routes'
import treatmentRoutes   from './modules/treatments/treatment.routes'
import paymentRoutes     from './modules/payments/payment.routes'
import inventoryRoutes   from './modules/inventory/inventory.routes'
import dashboardRoutes from './modules/dashboard/dashboard.routes'
import odontologiaRoutes from './modules/plugins/odontologia.routes'
import reportRoutes from './modules/reports/report.routes'


const app = Fastify({ logger: false })

async function bootstrap() {
  await app.register(helmet, { contentSecurityPolicy: false })
  await app.register(cors, {
    origin: env.CORS_ORIGINS.split(','),
    credentials: true,
  })
  await app.register(rateLimit, { max: env.RATE_LIMIT_MAX, timeWindow: env.RATE_LIMIT_WINDOW_MS })
  await app.register(jwt, { secret: env.JWT_SECRET })

  // Health check
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: env.NODE_ENV,
  }))

  const API = '/api/v1'
  await app.register(authRoutes,        { prefix: `${API}/auth` })
  await app.register(tenantRoutes,      { prefix: `${API}/tenants` })
  await app.register(patientRoutes,     { prefix: `${API}/patients` })
  await app.register(doctorRoutes,      { prefix: `${API}/doctors` })
  await app.register(appointmentRoutes, { prefix: `${API}/appointments` })
  await app.register(treatmentRoutes,   { prefix: `${API}/treatments` })
  await app.register(paymentRoutes,     { prefix: `${API}/payments` })
  await app.register(inventoryRoutes,   { prefix: `${API}/inventory` })
  await app.register(dashboardRoutes, { prefix: `${API}/dashboard` })
  await app.register(odontologiaRoutes, { prefix: `${API}/plugins/odontologia` })
  await app.register(reportRoutes, { prefix: `${API}/reports` })
  app.setErrorHandler((error, _req, reply) => {
    logger.error(error)
    reply.status(error.statusCode ?? 500).send({
      success: false,
      error: { code: 'ERROR', message: error.message },
    })
  })

  const address = await app.listen({ port: env.PORT, host: '0.0.0.0' })
  logger.info(`🚀 MediCore API → ${address}`)
}

const signals = ['SIGINT', 'SIGTERM']
signals.forEach((sig) => {
  process.on(sig, async () => {
    await app.close()
    await prisma.$disconnect()
    process.exit(0)
  })
})

bootstrap().catch((err) => { logger.error(err); process.exit(1) })
