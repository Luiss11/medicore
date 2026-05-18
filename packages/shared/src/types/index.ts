// ─────────────────────────────────────────────
// @medicore/shared — Shared TypeScript types
// Used across api, web, and other packages
// ─────────────────────────────────────────────

// ── API Response wrappers ─────────────────────

export interface ApiSuccess<T> {
  success: true
  data: T
  meta?: PaginationMeta
}

export interface ApiError {
  success: false
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

export interface PaginationMeta {
  total: number
  page: number
  limit: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

export interface PaginationQuery {
  page?: number
  limit?: number
  search?: string
  orderBy?: string
  order?: 'asc' | 'desc'
}

// ── Auth ──────────────────────────────────────

export interface JwtPayload {
  sub: string        // userId
  tenantId: string
  role: string
  email: string
  iat?: number
  exp?: number
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface LoginDto {
  email: string
  password: string
  tenantSlug: string
}

// ── Tenant context (injected by middleware) ───

export interface TenantContext {
  tenantId: string
  tenantSlug: string
  plan: string
  activePlugins: string[]
}

// ── Plugin system ─────────────────────────────

export const AVAILABLE_PLUGINS = [
  'odontologia',
  'oftalmologia',
  'dermatologia',
  'cardiologia',
  'psicologia',
  'pediatria',
  'ortopedia',
  'ginecologia',
  'neumologia',
  'medicina_general',
  'laboratorio',
] as const

export type PluginKey = typeof AVAILABLE_PLUGINS[number]

export interface PluginDefinition {
  key: PluginKey
  name: string
  specialty: string
  icon: string
  description: string
  plans: string[]          // Which plans include this plugin
}

// ── Common DTOs ───────────────────────────────

export interface DateRangeQuery {
  from?: string   // ISO date
  to?: string     // ISO date
}

export interface IdParam {
  id: string
}
