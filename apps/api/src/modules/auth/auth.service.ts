import { prisma } from '@medicore/database'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

// ─────────────────────────────────────────────
// AuthService — Login, tokens, logout
// ─────────────────────────────────────────────

export class AuthService {

  /**
   * Login with email + password + tenantSlug.
   * Returns user data (no password) for JWT generation.
   */
  async login(email: string, password: string, tenantSlug: string) {
    // 1. Find tenant
    const tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      include: {
        plugins: { where: { status: 'ACTIVE' }, select: { pluginKey: true } },
      },
    })

    if (!tenant || !tenant.isActive) {
      throw Object.assign(new Error('Clínica no encontrada o inactiva'), { statusCode: 401 })
    }

    // 2. Find user within that tenant
    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase(), tenantId: tenant.id, isActive: true },
    })

    if (!user) {
      throw Object.assign(new Error('Credenciales inválidas'), { statusCode: 401 })
    }

    // 3. Verify password
    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      throw Object.assign(new Error('Credenciales inválidas'), { statusCode: 401 })
    }

    // 4. Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    // 5. Create refresh token in DB
    const refreshToken = crypto.randomBytes(64).toString('hex')
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    await prisma.refreshToken.create({
      data: { userId: user.id, token: refreshToken, expiresAt },
    })

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
        plan: tenant.plan,
        plugins: tenant.plugins.map((p) => p.pluginKey),
      },
      refreshToken,
    }
  }

  /**
   * Exchange a refresh token for a new access token.
   */
  async refresh(token: string) {
    const record = await prisma.refreshToken.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            tenant: {
              include: {
                plugins: { where: { status: 'ACTIVE' }, select: { pluginKey: true } },
              },
            },
          },
        },
      },
    })

    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      throw Object.assign(new Error('Refresh token inválido o expirado'), { statusCode: 401 })
    }

    if (!record.user.isActive || !record.user.tenant.isActive) {
      throw Object.assign(new Error('Usuario o clínica inactivos'), { statusCode: 401 })
    }

    return {
      user: {
        id: record.user.id,
        name: record.user.name,
        email: record.user.email,
        role: record.user.role,
      },
      tenant: {
        id: record.user.tenant.id,
        slug: record.user.tenant.slug,
        name: record.user.tenant.name,
        plan: record.user.tenant.plan,
        plugins: record.user.tenant.plugins.map((p) => p.pluginKey),
      },
    }
  }

  /**
   * Revoke a refresh token (logout).
   */
  async logout(token: string) {
    await prisma.refreshToken.updateMany({
      where: { token },
      data: { revokedAt: new Date() },
    })
  }

  /**
   * Get user profile (used by /auth/me).
   */
  async getMe(userId: string, tenantId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        lastLoginAt: true,
        createdAt: true,
        doctorProfile: {
          select: { id: true, specialty: true, cedula: true },
        },
      },
    })

    if (!user) throw Object.assign(new Error('Usuario no encontrado'), { statusCode: 404 })
    return user
  }
}
