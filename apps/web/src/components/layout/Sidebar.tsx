'use client'

import { usePathname, useRouter } from 'next/navigation'
import { clearSession, getTenant, getUser } from '@/lib/api'
import { useState } from 'react'

const NAV = [
  { href: '/dashboard',            icon: '▦',  label: 'Dashboard' },
  { href: '/dashboard/pacientes',  icon: '👥', label: 'Pacientes' },
  { href: '/dashboard/doctores',   icon: '🩺', label: 'Doctores' },
  { href: '/dashboard/citas',      icon: '📅', label: 'Citas' },
  { href: '/dashboard/tratamientos', icon: '💊', label: 'Tratamientos' },
  { href: '/dashboard/pagos',      icon: '💳', label: 'Pagos' },
  { href: '/dashboard/inventario', icon: '📦', label: 'Inventario' },
  { href: '/dashboard/reportes', icon: '📊', label: 'Reportes' },
]

const PLUGIN_NAV: Record<string, { href: string; icon: string; label: string }[]> = {
  odontologia:    [{ href: '/dashboard/odontograma', icon: '🦷', label: 'Odontograma' }],
  oftalmologia:   [{ href: '/dashboard/vision',      icon: '👁️', label: 'Agudeza Visual' }],
  dermatologia:   [{ href: '/dashboard/mapa-corporal', icon: '🧴', label: 'Mapa Corporal' }],
  psicologia:     [{ href: '/dashboard/sesiones',    icon: '🧠', label: 'Sesiones' }],
  pediatria:      [{ href: '/dashboard/crecimiento', icon: '👶', label: 'Crecimiento' }],
}

export default function Sidebar() {
  const pathname  = usePathname()
  const router    = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const user   = getUser()
  const tenant = getTenant()

  const pluginLinks = (tenant?.plugins ?? []).flatMap(
    (p: string) => PLUGIN_NAV[p] ?? []
  )

  const logout = () => { clearSession(); router.push('/login') }

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  return (
    <aside
      className="flex flex-col h-screen sticky top-0 transition-all duration-300 flex-shrink-0"
      style={{
        width: collapsed ? '72px' : '240px',
        background: '#060d1a',
        borderRight: '1px solid #0f2035',
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b" style={{ borderColor: '#0f2035', minHeight: '64px' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #0891b2, #00c8e0)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L12 22M2 12L22 12" stroke="white" strokeWidth="3" strokeLinecap="round"/>
          </svg>
        </div>
        {!collapsed && (
          <div>
            <span className="font-cormorant text-lg font-semibold text-white leading-none">
              Medi<span style={{ color: '#00c8e0' }}>Core</span>
            </span>
            <p className="text-xs truncate max-w-[140px]" style={{ color: '#2a5a72', marginTop: 2 }}>
              {tenant?.name}
            </p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="ml-auto text-gray-600 hover:text-gray-400 transition-colors flex-shrink-0"
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {collapsed
              ? <path d="M9 18l6-6-6-6"/>
              : <path d="M15 18l-6-6 6-6"/>
            }
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">

        {/* Main */}
        <div className="px-3 space-y-1">
          {NAV.map((item) => {
            const active = isActive(item.href)
            return (
              <button
                key={item.href}
                onClick={() => router.push(item.href)}
                title={collapsed ? item.label : undefined}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left"
                style={{
                  background: active ? 'rgba(0,200,224,0.1)' : 'transparent',
                  color: active ? '#00c8e0' : '#4a7a94',
                  border: active ? '1px solid rgba(0,200,224,0.2)' : '1px solid transparent',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)' }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
              >
                <span className="text-lg flex-shrink-0 w-5 text-center leading-none">{item.icon}</span>
                {!collapsed && (
                  <span className="text-sm font-medium truncate">{item.label}</span>
                )}
                {!collapsed && active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#00c8e0' }} />
                )}
              </button>
            )
          })}
        </div>

        {/* Plugins */}
        {pluginLinks.length > 0 && (
          <div className="mt-6 px-3">
            {!collapsed && (
              <p className="text-xs font-semibold uppercase tracking-widest px-3 mb-2"
                style={{ color: '#1e4a62', letterSpacing: '0.15em' }}>
                Especialidad
              </p>
            )}
            <div className="space-y-1">
              {pluginLinks.map((item) => {
                const active = isActive(item.href)
                return (
                  <button
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    title={collapsed ? item.label : undefined}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-left"
                    style={{
                      background: active ? 'rgba(0,200,224,0.1)' : 'transparent',
                      color: active ? '#00c8e0' : '#4a7a94',
                      border: active ? '1px solid rgba(0,200,224,0.2)' : '1px solid transparent',
                    }}
                  >
                    <span className="text-lg flex-shrink-0 w-5 text-center leading-none">{item.icon}</span>
                    {!collapsed && <span className="text-sm font-medium truncate">{item.label}</span>}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </nav>

      {/* User + logout */}
      <div className="p-3 border-t" style={{ borderColor: '#0f2035' }}>
        <div className="flex items-center gap-3 px-2 py-2 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #0891b2, #00c8e0)' }}>
            {user?.name?.[0] ?? 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate leading-none">{user?.name}</p>
              <p className="text-xs truncate mt-0.5" style={{ color: '#2a5a72' }}>{user?.role}</p>
            </div>
          )}
          {!collapsed && (
            <button onClick={logout} title="Cerrar sesión"
              className="flex-shrink-0 text-gray-600 hover:text-red-400 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
