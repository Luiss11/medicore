import { FastifyRequest, FastifyReply } from 'fastify'
import { prisma } from '@medicore/database'
import type { JwtPayload, TenantContext } from '@medicore/shared'

// ─────────────────────────────────────────────
// Auth Middleware
// Verifies JWT and injects tenant context
// into every authenticated request
// ─────────────────────────────────────────────

// Extend FastifyRequest with our custom fields
declare module 'fastify' {
  interface FastifyRequest {
    user: JwtPayload
    tenant: TenantContext
  }
}

/**
 * requireAuth — Verifies JWT and loads tenant context.
 * Use as preHandler on protected routes.
 */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    // 1. Verify JWT
    await request.jwtVerify()
    const payload = request.user as JwtPayload

    // 2. Load tenant with active plugins
    const tenant = await prisma.tenant.findUnique({
      where: { id: payload.tenantId },
      select: {
        id: true,
        slug: true,
        plan: true,
        isActive: true,
        plugins: {
          where: { status: 'ACTIVE' },
          select: { pluginKey: true },
        },
      },
    })

    if (!tenant || !tenant.isActive) {
      return reply.status(401).send({
        success: false,
        error: { code: 'TENANT_INACTIVE', message: 'Tenant not found or inactive' },
      })
    }

    // 3. Inject tenant context
    request.tenant = {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      plan: tenant.plan,
      activePlugins: tenant.plugins.map((p) => p.pluginKey),
    }
  } catch (err) {
    return reply.status(401).send({
      success: false,
      error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' },
    })
  }
}

/**
 * requireRole — Checks that user has one of the allowed roles.
 * Always use AFTER requireAuth.
 */
export function requireRole(...roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!roles.includes(request.user.role)) {
      return reply.status(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Required role: ${roles.join(' | ')}`,
        },
      })
    }
  }
}

/**
 * requirePlugin — Ensures tenant has a plugin active.
 * Use for plugin-specific endpoints.
 */
export function requirePlugin(pluginKey: string) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.tenant.activePlugins.includes(pluginKey)) {
      return reply.status(403).send({
        success: false,
        error: {
          code: 'PLUGIN_NOT_ACTIVE',
          message: `Plugin "${pluginKey}" is not active for your plan. Upgrade to enable it.`,
        },
      })
    }
  }
}
