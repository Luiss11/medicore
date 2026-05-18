'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
function authHeaders() {
  const t = localStorage.getItem('mc_access_token')
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }
}

const bloodLabel = (bt?: string) => bt ? bt.replace('_POS','+').replace('_NEG','-').replace('UNKNOWN','—') : '—'
const genderLabel: Record<string, string> = { MALE:'Masculino', FEMALE:'Femenino', OTHER:'Otro', PREFER_NOT_TO_SAY:'No especificado' }
const statusColors: Record<string, string> = { SCHEDULED:'#f59e0b', CONFIRMED:'#10b981', COMPLETED:'#6b7280', CANCELLED:'#ef4444', NO_SHOW:'#ef4444', IN_PROGRESS:'#3b82f6' }
const statusLabels: Record<string, string> = { SCHEDULED:'Programada', CONFIRMED:'Confirmada', COMPLETED:'Atendida', CANCELLED:'Cancelada', NO_SHOW:'No asistió', IN_PROGRESS:'En consulta' }

export default function PatientProfilePage() {
  const router   = useRouter()
  const { id }   = useParams() as { id: string }
  const [patient, setPatient]         = useState<any>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [history, setHistory]         = useState<any[]>([])
  const [tab, setTab]                 = useState<'info'|'citas'|'historial'>('info')
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/v1/patients/${id}`, { headers: authHeaders() }).then(r => r.json()),
      fetch(`${API}/api/v1/patients/${id}/appointments`, { headers: authHeaders() }).then(r => r.json()),
      fetch(`${API}/api/v1/patients/${id}/clinical-history`, { headers: authHeaders() }).then(r => r.json()),
    ]).then(([p, a, h]) => {
      if (p.success) setPatient(p.data)
      if (a.success) setAppointments(a.data)
      if (h.success) setHistory(h.data)
    }).finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="p-8">
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-white rounded-2xl" />
        <div className="h-64 bg-white rounded-2xl" />
      </div>
    </div>
  )

  if (!patient) return (
    <div className="p-8 text-center">
      <p className="text-gray-500">Paciente no encontrado</p>
      <button onClick={() => router.back()} className="mt-4 text-sm text-cyan-600">← Volver</button>
    </div>
  )

  const age = patient.dateOfBirth
    ? Math.floor((Date.now() - new Date(patient.dateOfBirth).getTime()) / (1000*60*60*24*365.25))
    : null

  return (
    <div className="p-8">
      {/* Back */}
      <button onClick={() => router.push('/dashboard/pacientes')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors">
        ← Volver a pacientes
      </button>

      {/* Hero card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #0891b2, #00c8e0)' }}>
            {patient.firstName[0]}{patient.lastName[0]}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-cormorant text-3xl font-semibold text-gray-900">
                  {patient.firstName} {patient.lastName}
                </h1>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  {age && <span className="text-sm text-gray-500">{age} años</span>}
                  {patient.gender && patient.gender !== 'PREFER_NOT_TO_SAY' && (
                    <span className="text-sm text-gray-500">{genderLabel[patient.gender]}</span>
                  )}
                  {patient.bloodType && patient.bloodType !== 'UNKNOWN' && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                      style={{ background: '#ef4444' }}>
                      {bloodLabel(patient.bloodType)}
                    </span>
                  )}
                  {patient.allergies && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                      style={{ background: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa' }}>
                      ⚠️ {patient.allergies}
                    </span>
                  )}
                </div>
              </div>
              <button className="px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
                style={{ background: '#e0f2fe', color: '#0891b2' }}>
                ✏️ Editar
              </button>
            </div>

            {/* Contact row */}
            <div className="flex gap-6 mt-4 flex-wrap">
              {patient.phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>📞</span> {patient.phone}
                </div>
              )}
              {patient.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>✉️</span> {patient.email}
                </div>
              )}
              {patient.city && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>📍</span> {patient.city}
                </div>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-4 flex-shrink-0">
            <div className="text-center px-4 py-3 rounded-xl" style={{ background: '#e0f2fe' }}>
              <p className="font-cormorant text-2xl font-bold" style={{ color: '#0891b2' }}>
                {patient._count?.appointments ?? 0}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Citas</p>
            </div>
            <div className="text-center px-4 py-3 rounded-xl" style={{ background: '#f0fdf4' }}>
              <p className="font-cormorant text-2xl font-bold" style={{ color: '#059669' }}>
                {history.length}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">Notas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          {([
            { key: 'info',     label: '📋 Información' },
            { key: 'citas',    label: `📅 Citas (${appointments.length})` },
            { key: 'historial',label: `🩺 Historial (${history.length})` },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="px-6 py-4 text-sm font-semibold transition-all border-b-2"
              style={{
                borderBottomColor: tab === t.key ? '#0891b2' : 'transparent',
                color: tab === t.key ? '#0891b2' : '#94a3b8',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab: Info */}
        {tab === 'info' && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: 'Nombre completo', value: `${patient.firstName} ${patient.lastName}` },
              { label: 'Fecha de nacimiento', value: patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString('es-MX') : '—' },
              { label: 'Género', value: genderLabel[patient.gender] ?? '—' },
              { label: 'Tipo de sangre', value: bloodLabel(patient.bloodType) },
              { label: 'Teléfono', value: patient.phone ?? '—' },
              { label: 'Correo', value: patient.email ?? '—' },
              { label: 'Dirección', value: patient.address ?? '—' },
              { label: 'Ciudad', value: patient.city ?? '—' },
              { label: 'Alergias', value: patient.allergies ?? 'Ninguna conocida' },
              { label: 'Condiciones crónicas', value: patient.chronicConditions ?? '—' },
              { label: 'Medicamentos actuales', value: patient.currentMedications ?? '—' },
              { label: 'Contacto emergencia', value: patient.emergencyContact ? `${patient.emergencyContact} · ${patient.emergencyContactPhone ?? ''}` : '—' },
            ].map(item => (
              <div key={item.label}>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">{item.label}</p>
                <p className="text-sm text-gray-800 font-medium">{item.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tab: Citas */}
        {tab === 'citas' && (
          <div className="p-6">
            {appointments.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">📅</p>
                <p className="text-gray-500 text-sm">Sin citas registradas</p>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((a: any) => (
                  <div key={a.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="text-center w-12 flex-shrink-0">
                      <p className="text-lg font-bold text-gray-800">{new Date(a.scheduledAt).getDate()}</p>
                      <p className="text-xs text-gray-400">{new Date(a.scheduledAt).toLocaleDateString('es-MX',{month:'short'})}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">
                        Dr. {a.doctor.firstName} {a.doctor.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{a.doctor.specialty} · {new Date(a.scheduledAt).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'})}</p>
                      {a.treatments?.length > 0 && (
                        <p className="text-xs text-gray-400 mt-0.5">{a.treatments.map((t:any)=>t.treatment.name).join(', ')}</p>
                      )}
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0"
                      style={{ background: `${statusColors[a.status]}18`, color: statusColors[a.status] }}>
                      {statusLabels[a.status] ?? a.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Historial clínico */}
        {tab === 'historial' && (
          <div className="p-6">
            {history.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-4xl mb-3">🩺</p>
                <p className="text-gray-500 text-sm">Sin notas clínicas registradas</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((note: any) => (
                  <div key={note.id} className="border border-gray-100 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold text-gray-800">
                        Dr. {note.doctor.firstName} {note.doctor.lastName}
                      </p>
                      <p className="text-xs text-gray-400">{new Date(note.createdAt).toLocaleDateString('es-MX')}</p>
                    </div>
                    {[
                      { key: 'S', label: 'Subjetivo', value: note.subjective },
                      { key: 'O', label: 'Objetivo',  value: note.objective },
                      { key: 'A', label: 'Evaluación',value: note.assessment },
                      { key: 'P', label: 'Plan',       value: note.plan },
                    ].filter(s => s.value).map(s => (
                      <div key={s.key} className="flex gap-3 mb-2">
                        <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: '#0891b2' }}>{s.key}</span>
                        <p className="text-sm text-gray-700">{s.value}</p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
