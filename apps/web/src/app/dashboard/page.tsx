'use client'

import { useEffect, useState } from 'react'
import { getUser, getTenant } from '@/lib/api'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

interface Stats {
  citasHoy:        number
  citasPendientes: number
  pacientesActivos: number
  ingresosMes:     number
  stockBajo:       number
  proximasCitas:   any[]
}

function KPICard({ icon, label, value, color, sub }: {
  icon: string; label: string; value: string | number; color: string; sub?: string
}) {
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
          style={{ background: `${color}18` }}>
          {icon}
        </div>
        <div className="w-2 h-2 rounded-full mt-1" style={{ background: color }} />
      </div>
      <p className="font-cormorant text-3xl font-bold text-gray-900 leading-none">{value}</p>
      <p className="text-xs text-gray-500 mt-1.5 font-medium">{label}</p>
      {sub && <p className="text-xs mt-1" style={{ color }}>{sub}</p>}
    </div>
  )
}

function AppointmentRow({ appt }: { appt: any }) {
  const time = new Date(appt.scheduledAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  const statusColors: Record<string, string> = {
    SCHEDULED: '#f59e0b', CONFIRMED: '#10b981', IN_PROGRESS: '#3b82f6',
    COMPLETED: '#6b7280', CANCELLED: '#ef4444', NO_SHOW: '#ef4444',
  }
  const statusLabels: Record<string, string> = {
    SCHEDULED: 'Programada', CONFIRMED: 'Confirmada', IN_PROGRESS: 'En consulta',
    COMPLETED: 'Atendida', CANCELLED: 'Cancelada', NO_SHOW: 'No asistió',
  }
  return (
    <div className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
      <div className="w-14 text-center flex-shrink-0">
        <span className="text-sm font-bold text-gray-800">{time}</span>
      </div>
      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
        style={{ background: 'linear-gradient(135deg, #0891b2, #00c8e0)' }}>
        {appt.patient.firstName[0]}{appt.patient.lastName[0]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">
          {appt.patient.firstName} {appt.patient.lastName}
        </p>
        <p className="text-xs text-gray-500 truncate">
          Dr. {appt.doctor.firstName} {appt.doctor.lastName} · {appt.doctor.specialty}
        </p>
      </div>
      <span className="px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
        style={{ background: `${statusColors[appt.status]}18`, color: statusColors[appt.status] }}>
        {statusLabels[appt.status] ?? appt.status}
      </span>
    </div>
  )
}

export default function DashboardPage() {
  const user   = getUser()
  const tenant = getTenant()
  const [stats, setStats]     = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  useEffect(() => {
    const token = localStorage.getItem('mc_access_token')
    fetch(`${API}/api/v1/dashboard/stats`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.success) setStats(d.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const fmt = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-cormorant text-4xl font-semibold text-gray-900">
          {greeting}, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {tenant?.name} · Plan {tenant?.plan} ·{' '}
          {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
              <div className="w-11 h-11 bg-gray-100 rounded-xl mb-4" />
              <div className="h-8 w-16 bg-gray-100 rounded mb-2" />
              <div className="h-3 w-24 bg-gray-50 rounded" />
            </div>
          ))
        ) : (
          <>
            <KPICard icon="📅" label="Citas hoy"         value={stats?.citasHoy ?? 0}          color="#0891b2" sub={`${stats?.citasPendientes ?? 0} pendientes`} />
            <KPICard icon="👥" label="Pacientes activos"  value={stats?.pacientesActivos ?? 0}   color="#059669" />
            <KPICard icon="💳" label="Ingresos del mes"   value={fmt(stats?.ingresosMes ?? 0)}   color="#7c3aed" />
            <KPICard icon="📦" label="Stock bajo"         value={stats?.stockBajo ?? 0}          color={stats?.stockBajo ? '#dc2626' : '#059669'} sub={stats?.stockBajo ? 'Requiere atención' : 'Todo en orden'} />
          </>
        )}
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Citas del día */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-gray-50">
            <div>
              <h2 className="font-cormorant text-xl font-semibold text-gray-900">Agenda de hoy</h2>
              <p className="text-xs text-gray-500 mt-0.5">{stats?.citasHoy ?? '—'} citas programadas</p>
            </div>
            <button className="text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
              style={{ background: '#e0f2fe', color: '#0891b2' }}>
              Ver todas →
            </button>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}
              </div>
            ) : stats?.proximasCitas?.length ? (
              stats.proximasCitas.map((a: any) => <AppointmentRow key={a.id} appt={a} />)
            ) : (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">📅</p>
                <p className="text-gray-500 text-sm">Sin citas programadas para hoy</p>
                <button className="mt-4 text-sm font-semibold px-4 py-2 rounded-lg"
                  style={{ background: '#e0f2fe', color: '#0891b2' }}>
                  + Nueva cita
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Panel derecho */}
        <div className="flex flex-col gap-5">
          {/* Accesos rápidos */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-cormorant text-xl font-semibold text-gray-900 mb-4">Acceso rápido</h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: '👤', label: 'Nuevo paciente',  color: '#0891b2' },
                { icon: '📅', label: 'Nueva cita',      color: '#059669' },
                { icon: '💊', label: 'Tratamientos',    color: '#7c3aed' },
                { icon: '📊', label: 'Reportes',        color: '#d97706' },
              ].map(a => (
                <button key={a.label}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl text-center transition-all hover:scale-105"
                  style={{ background: `${a.color}10`, border: `1px solid ${a.color}20` }}>
                  <span className="text-2xl">{a.icon}</span>
                  <span className="text-xs font-semibold" style={{ color: a.color }}>{a.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Plugins activos */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-cormorant text-xl font-semibold text-gray-900 mb-4">Módulos activos</h2>
            <div className="space-y-2">
              {(tenant?.plugins ?? []).map((p: string) => (
                <div key={p} className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full" style={{ background: '#00c8e0' }} />
                  <span className="text-gray-700 capitalize font-medium">{p}</span>
                </div>
              ))}
              {(tenant?.plugins ?? []).length === 0 && (
                <p className="text-xs text-gray-400">Sin plugins activos</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
