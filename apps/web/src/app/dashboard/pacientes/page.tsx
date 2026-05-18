'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

function authHeaders() {
  const token = localStorage.getItem('mc_access_token')
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

// ─── Types ────────────────────────────────────
interface Patient {
  id: string
  firstName: string
  lastName: string
  dateOfBirth?: string
  gender?: string
  phone?: string
  email?: string
  bloodType?: string
  allergies?: string
  createdAt: string
  _count: { appointments: number }
}

// ─── Age helper ───────────────────────────────
function calcAge(dob?: string) {
  if (!dob) return '—'
  const diff = Date.now() - new Date(dob).getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)) + ' años'
}

// ─── Blood type badge ─────────────────────────
const bloodColors: Record<string, string> = {
  A_POS:'#ef4444', A_NEG:'#dc2626', B_POS:'#f97316', B_NEG:'#ea580c',
  AB_POS:'#8b5cf6', AB_NEG:'#7c3aed', O_POS:'#0891b2', O_NEG:'#0e7490',
  UNKNOWN:'#9ca3af',
}
function bloodLabel(bt?: string) {
  if (!bt || bt === 'UNKNOWN') return '—'
  return bt.replace('_POS','+').replace('_NEG','-')
}

// ─── Create Patient Modal ─────────────────────
function PatientModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    firstName:'', lastName:'', dateOfBirth:'', gender:'PREFER_NOT_TO_SAY',
    phone:'', email:'', address:'', city:'', bloodType:'UNKNOWN',
    allergies:'', chronicConditions:'', emergencyContact:'', emergencyContactPhone:'',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const set = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.firstName || !form.lastName) { setError('Nombre y apellido son obligatorios'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API}/api/v1/patients`, {
        method: 'POST', headers: authHeaders(), body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error?.message)
      onCreated()
    } catch (err: any) {
      setError(err.message ?? 'Error al crear paciente')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="font-cormorant text-2xl font-semibold text-gray-900">Nuevo Paciente</h2>
            <p className="text-xs text-gray-500 mt-0.5">Completa la información del paciente</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-5">
          {/* Nombre */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Nombre *</label>
              <input name="firstName" value={form.firstName} onChange={set} placeholder="María"
                className="mc-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Apellido *</label>
              <input name="lastName" value={form.lastName} onChange={set} placeholder="López Ramírez"
                className="mc-input" />
            </div>
          </div>

          {/* Nacimiento + Género */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Fecha de nacimiento</label>
              <input name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={set}
                className="mc-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Género</label>
              <select name="gender" value={form.gender} onChange={set} className="mc-input">
                <option value="PREFER_NOT_TO_SAY">No especificado</option>
                <option value="MALE">Masculino</option>
                <option value="FEMALE">Femenino</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>
          </div>

          {/* Contacto */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Teléfono</label>
              <input name="phone" value={form.phone} onChange={set} placeholder="+52 618 000 0000"
                className="mc-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Correo electrónico</label>
              <input name="email" type="email" value={form.email} onChange={set} placeholder="paciente@email.com"
                className="mc-input" />
            </div>
          </div>

          {/* Dirección */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Dirección</label>
              <input name="address" value={form.address} onChange={set} placeholder="Calle y número"
                className="mc-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Ciudad</label>
              <input name="city" value={form.city} onChange={set} placeholder="Durango"
                className="mc-input" />
            </div>
          </div>

          {/* Médico */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Tipo de sangre</label>
              <select name="bloodType" value={form.bloodType} onChange={set} className="mc-input">
                <option value="UNKNOWN">Desconocido</option>
                {['A_POS','A_NEG','B_POS','B_NEG','AB_POS','AB_NEG','O_POS','O_NEG'].map(b => (
                  <option key={b} value={b}>{bloodLabel(b)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Alergias</label>
              <input name="allergies" value={form.allergies} onChange={set} placeholder="Penicilina, látex..."
                className="mc-input" />
            </div>
          </div>

          {/* Contacto emergencia */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Contacto de emergencia</label>
              <input name="emergencyContact" value={form.emergencyContact} onChange={set} placeholder="Nombre"
                className="mc-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Teléfono emergencia</label>
              <input name="emergencyContactPhone" value={form.emergencyContactPhone} onChange={set} placeholder="+52 618 000 0000"
                className="mc-input" />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg text-sm"
              style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
              ⚠️ {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: '#f1f5f9', color: '#64748b' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: 'linear-gradient(135deg, #0891b2, #00c8e0)' }}>
              {loading ? 'Guardando...' : 'Crear paciente →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────
export default function PacientesPage() {
  const router = useRouter()
  const [patients, setPatients] = useState<Patient[]>([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [search, setSearch]     = useState('')
  const [loading, setLoading]   = useState(true)
  const [showModal, setShowModal] = useState(false)
  const LIMIT = 10

  const fetchPatients = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
      if (search) params.set('search', search)
      const res  = await fetch(`${API}/api/v1/patients?${params}`, { headers: authHeaders() })
      const data = await res.json()
      if (data.success) { setPatients(data.data); setTotal(data.meta.total) }
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [page, search])

  useEffect(() => {
    const t = setTimeout(fetchPatients, search ? 400 : 0)
    return () => clearTimeout(t)
  }, [fetchPatients])

  const totalPages = Math.ceil(total / LIMIT)

  const genderIcon = (g?: string) => ({ MALE:'♂', FEMALE:'♀', OTHER:'⚧', PREFER_NOT_TO_SAY:'—' }[g ?? 'PREFER_NOT_TO_SAY'] ?? '—')

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-cormorant text-4xl font-semibold text-gray-900">Pacientes</h1>
          <p className="text-sm text-gray-500 mt-1">{total} paciente{total !== 1 ? 's' : ''} registrado{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg, #0891b2, #00c8e0)' }}>
          <span className="text-lg leading-none">+</span> Nuevo paciente
        </button>
      </div>

      {/* Search + filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
        <div className="p-4">
          <div className="relative">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Buscar por nombre, teléfono o correo..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-cyan-400 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-t border-gray-100">
                {['Paciente','Edad','Género','Teléfono','Sangre','Citas','Registrado',''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-t border-gray-50">
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded animate-pulse" style={{ width: j === 0 ? '140px' : '60px' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : patients.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-16 text-center">
                  <p className="text-4xl mb-3">👥</p>
                  <p className="text-gray-500 text-sm">{search ? 'Sin resultados para tu búsqueda' : 'No hay pacientes registrados aún'}</p>
                  {!search && (
                    <button onClick={() => setShowModal(true)} className="mt-4 text-sm font-semibold px-4 py-2 rounded-lg"
                      style={{ background: '#e0f2fe', color: '#0891b2' }}>
                      + Agregar primer paciente
                    </button>
                  )}
                </td></tr>
              ) : patients.map(p => (
                <tr key={p.id}
                  onClick={() => router.push(`/dashboard/pacientes/${p.id}`)}
                  className="border-t border-gray-50 hover:bg-blue-50/40 cursor-pointer transition-colors group">
                  {/* Avatar + nombre */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #0891b2, #00c8e0)' }}>
                        {p.firstName[0]}{p.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{p.firstName} {p.lastName}</p>
                        <p className="text-xs text-gray-400">{p.email ?? '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{calcAge(p.dateOfBirth)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{genderIcon(p.gender)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.phone ?? '—'}</td>
                  <td className="px-4 py-3">
                    {p.bloodType && p.bloodType !== 'UNKNOWN' ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                        style={{ background: bloodColors[p.bloodType] ?? '#9ca3af' }}>
                        {bloodLabel(p.bloodType)}
                      </span>
                    ) : <span className="text-gray-400 text-sm">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold" style={{ color: '#0891b2' }}>
                      {p._count.appointments}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(p.createdAt).toLocaleDateString('es-MX')}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium text-gray-400 group-hover:text-cyan-500 transition-colors">Ver →</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-xs text-gray-500">
              Mostrando {((page-1)*LIMIT)+1}–{Math.min(page*LIMIT, total)} de {total}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40"
                style={{ background: '#f1f5f9', color: '#475569' }}>
                ← Anterior
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(n => (
                <button key={n} onClick={() => setPage(n)}
                  className="w-8 h-8 rounded-lg text-xs font-semibold transition-colors"
                  style={{ background: page === n ? '#0891b2' : '#f1f5f9', color: page === n ? 'white' : '#475569' }}>
                  {n}
                </button>
              ))}
              <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40"
                style={{ background: '#f1f5f9', color: '#475569' }}>
                Siguiente →
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <PatientModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); fetchPatients() }}
        />
      )}
    </div>
  )
}
