// ─────────────────────────────────────────────
// MediCore API Client
// ─────────────────────────────────────────────

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('mc_access_token') : null

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data?.error?.message ?? 'Error de servidor')
  }

  return data
}

// ── Auth ──────────────────────────────────────

export interface LoginResponse {
  success: boolean
  data: {
    accessToken:  string
    refreshToken: string
    expiresIn:    number
    user: {
      id:    string
      name:  string
      email: string
      role:  string
    }
    tenant: {
      id:      string
      slug:    string
      name:    string
      plan:    string
      plugins: string[]
    }
  }
}

export async function login(email: string, password: string, tenantSlug: string): Promise<LoginResponse> {
  return request('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password, tenantSlug }),
  })
}

export function saveSession(data: LoginResponse['data']) {
  localStorage.setItem('mc_access_token',  data.accessToken)
  localStorage.setItem('mc_refresh_token', data.refreshToken)
  localStorage.setItem('mc_user',          JSON.stringify(data.user))
  localStorage.setItem('mc_tenant',        JSON.stringify(data.tenant))
}

export function clearSession() {
  localStorage.removeItem('mc_access_token')
  localStorage.removeItem('mc_refresh_token')
  localStorage.removeItem('mc_user')
  localStorage.removeItem('mc_tenant')
}

export function getUser() {
  if (typeof window === 'undefined') return null
  const u = localStorage.getItem('mc_user')
  return u ? JSON.parse(u) : null
}

export function getTenant() {
  if (typeof window === 'undefined') return null
  const t = localStorage.getItem('mc_tenant')
  return t ? JSON.parse(t) : null
}

export function isAuthenticated() {
  if (typeof window === 'undefined') return false
  return !!localStorage.getItem('mc_access_token')
}
