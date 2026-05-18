'use client'

import { useEffect, useState, useCallback } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
function authHeaders() {
  const t = localStorage.getItem('mc_access_token')
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }
}

// ─── Constants ────────────────────────────────
const DAYS   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

const STATUS_COLOR: Record<string, string> = {
  SCHEDULED:'#f59e0b', CONFIRMED:'#10b981', IN_PROGRESS:'#3b82f6',
  COMPLETED:'#94a3b8', CANCELLED:'#ef4444', NO_SHOW:'#f97316',
}
const STATUS_LABEL: Record<string, string> = {
  SCHEDULED:'Programada', CONFIRMED:'Confirmada', IN_PROGRESS:'En consulta',
  COMPLETED:'Atendida', CANCELLED:'Cancelada', NO_SHOW:'No asistió',
}

// ─── New Appointment Modal ────────────────────
function NewAppointmentModal({
  initialDate, onClose, onCreated,
}: { initialDate: Date; onClose: () => void; onCreated: () => void }) {

  const [patients,   setPatients]   = useState<any[]>([])
  const [doctors,    setDoctors]    = useState<any[]>([])
  const [treatments, setTreatments] = useState<any[]>([])
  const [form, setForm] = useState({
    patientId: '', doctorId: '', reason: '', notes: '',
    date: initialDate.toISOString().split('T')[0],
    time: '09:00', durationMin: 30,
    treatmentIds: [] as string[],
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    Promise.all([
      fetch(`${API}/api/v1/patients?limit=100`, { headers: authHeaders() }).then(r => r.json()),
      fetch(`${API}/api/v1/doctors`,            { headers: authHeaders() }).then(r => r.json()),
      fetch(`${API}/api/v1/treatments`,          { headers: authHeaders() }).then(r => r.json()),
    ]).then(([p, d, t]) => {
      if (p.success) setPatients(p.data)
      if (d.success) setDoctors(d.data)
      if (t.success) setTreatments(t.data)
    })
  }, [])

  const toggleTreatment = (id: string) =>
    setForm(f => ({
      ...f,
      treatmentIds: f.treatmentIds.includes(id)
        ? f.treatmentIds.filter(t => t !== id)
        : [...f.treatmentIds, id],
    }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.patientId || !form.doctorId) { setError('Selecciona paciente y doctor'); return }
    setLoading(true); setError('')
    try {
      const scheduledAt = new Date(`${form.date}T${form.time}:00`)
      const res = await fetch(`${API}/api/v1/appointments`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ ...form, scheduledAt: scheduledAt.toISOString() }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error?.message)
      onCreated()
    } catch (err: any) {
      setError(err.message ?? 'Error al crear cita')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="font-cormorant text-2xl font-semibold text-gray-900">Nueva Cita</h2>
            <p className="text-xs text-gray-500 mt-0.5">Programa una consulta</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100">✕</button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          {/* Paciente */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Paciente *</label>
            <select value={form.patientId} onChange={e => setForm(f => ({ ...f, patientId: e.target.value }))} className="mc-input">
              <option value="">Seleccionar paciente...</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
              ))}
            </select>
          </div>

          {/* Doctor */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Doctor *</label>
            <select value={form.doctorId} onChange={e => setForm(f => ({ ...f, doctorId: e.target.value }))} className="mc-input">
              <option value="">Seleccionar doctor...</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>Dr. {d.firstName} {d.lastName} — {d.specialty}</option>
              ))}
            </select>
          </div>

          {/* Fecha y hora */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Fecha</label>
              <input type="date" value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="mc-input" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Hora</label>
              <input type="time" value={form.time}
                onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className="mc-input" />
            </div>
          </div>

          {/* Duración + Motivo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Duración (min)</label>
              <select value={form.durationMin} onChange={e => setForm(f => ({ ...f, durationMin: parseInt(e.target.value) }))} className="mc-input">
                {[15,30,45,60,90,120].map(m => <option key={m} value={m}>{m} min</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">Motivo</label>
              <input placeholder="Consulta, limpieza..." value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} className="mc-input" />
            </div>
          </div>

          {/* Tratamientos */}
          {treatments.length > 0 && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Tratamientos</label>
              <div className="flex flex-wrap gap-2">
                {treatments.map(t => (
                  <button key={t.id} type="button"
                    onClick={() => toggleTreatment(t.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                    style={{
                      background: form.treatmentIds.includes(t.id) ? '#0891b2' : '#f1f5f9',
                      color: form.treatmentIds.includes(t.id) ? 'white' : '#64748b',
                    }}>
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg text-sm"
              style={{ background: '#fef2f2', color: '#dc2626' }}>
              ⚠️ {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold"
              style={{ background: '#f1f5f9', color: '#64748b' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #0891b2, #00c8e0)' }}>
              {loading ? 'Guardando...' : 'Agendar cita →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Appointment Card ─────────────────────────
function AppointmentCard({ appt, onStatusChange }: { appt: any; onStatusChange: () => void }) {
  const [open, setOpen] = useState(false)
  const time = new Date(appt.scheduledAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })

  const changeStatus = async (status: string) => {
    await fetch(`${API}/api/v1/appointments/${appt.id}/status`, {
      method: 'PATCH', headers: authHeaders(),
      body: JSON.stringify({ status }),
    })
    onStatusChange()
    setOpen(false)
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {/* Time */}
        <div className="text-center flex-shrink-0 w-12">
          <p className="text-sm font-bold text-gray-800">{time}</p>
          <p className="text-xs text-gray-400">{appt.durationMin}min</p>
        </div>

        {/* Color bar */}
        <div className="w-1 self-stretch rounded-full flex-shrink-0"
          style={{ background: STATUS_COLOR[appt.status] }} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {appt.patient.firstName} {appt.patient.lastName}
          </p>
          <p className="text-xs text-gray-500 truncate">
            Dr. {appt.doctor.firstName} {appt.doctor.lastName}
          </p>
          {appt.reason && <p className="text-xs text-gray-400 mt-0.5 truncate">{appt.reason}</p>}
          {appt.treatments?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {appt.treatments.map((t: any) => (
                <span key={t.treatmentId} className="px-1.5 py-0.5 rounded text-xs"
                  style={{ background: '#e0f2fe', color: '#0891b2' }}>
                  {t.treatment.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Status + actions */}
        <div className="relative flex-shrink-0">
          <button onClick={() => setOpen(o => !o)}
            className="px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ background: `${STATUS_COLOR[appt.status]}18`, color: STATUS_COLOR[appt.status] }}>
            {STATUS_LABEL[appt.status]}
          </button>

          {open && (
            <div className="absolute right-0 top-8 bg-white rounded-xl shadow-xl border border-gray-100 z-10 overflow-hidden w-40">
              {Object.entries(STATUS_LABEL)
                .filter(([k]) => k !== appt.status && k !== 'CANCELLED')
                .map(([k, v]) => (
                  <button key={k} onClick={() => changeStatus(k)}
                    className="w-full px-3 py-2 text-left text-xs font-medium hover:bg-gray-50 transition-colors flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLOR[k] }} />
                    {v}
                  </button>
                ))}
              <button onClick={() => changeStatus('CANCELLED')}
                className="w-full px-3 py-2 text-left text-xs font-medium text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Calendar Page ───────────────────────
export default function CitasPage() {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDate, setSelectedDate] = useState(today)
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading]           = useState(true)
  const [showModal, setShowModal]       = useState(false)

  // Fetch entire month of appointments
  const fetchMonth = useCallback(async () => {
    setLoading(true)
    const from = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    const to   = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59)
    try {
      const res  = await fetch(
        `${API}/api/v1/appointments?from=${from.toISOString()}&to=${to.toISOString()}&limit=200`,
        { headers: authHeaders() }
      )
      const data = await res.json()
      if (data.success) setAppointments(data.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [currentMonth])

  useEffect(() => { fetchMonth() }, [fetchMonth])

  // Calendar grid
  const daysInMonth  = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()
  const calendarDays = Array.from({ length: firstDayOfMonth }, () => null)
    .concat(Array.from({ length: daysInMonth }, (_, i) => i + 1))

  // Appointments for a specific day
  const apptsByDay = (day: number) =>
    appointments.filter(a => {
      const d = new Date(a.scheduledAt)
      return d.getDate() === day && d.getMonth() === currentMonth.getMonth() && d.getFullYear() === currentMonth.getFullYear()
    })

  // Selected day appointments
  const selectedAppts = appointments.filter(a => {
    const d = new Date(a.scheduledAt)
    return d.toDateString() === selectedDate.toDateString()
  }).sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())

  const isToday = (day: number) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return d.toDateString() === today.toDateString()
  }

  const isSelected = (day: number) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    return d.toDateString() === selectedDate.toDateString()
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-cormorant text-4xl font-semibold text-gray-900">Agenda</h1>
          <p className="text-sm text-gray-500 mt-1">{appointments.length} citas este mes</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg"
          style={{ background: 'linear-gradient(135deg, #0891b2, #00c8e0)' }}>
          <span className="text-lg leading-none">+</span> Nueva cita
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Calendar ── */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-cormorant text-2xl font-semibold text-gray-900">
              {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h2>
            <div className="flex gap-2">
              <button onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth()-1, 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
                ‹
              </button>
              <button onClick={() => {
                setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1))
                setSelectedDate(today)
              }} className="px-3 py-1 rounded-lg text-xs font-semibold transition-colors"
                style={{ background: '#e0f2fe', color: '#0891b2' }}>
                Hoy
              </button>
              <button onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth()+1, 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors">
                ›
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-semibold uppercase tracking-wide py-2"
                style={{ color: '#94a3b8' }}>{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} />
              const dayAppts = apptsByDay(day)
              const selected = isSelected(day)
              const todayDay = isToday(day)

              return (
                <button key={day}
                  onClick={() => setSelectedDate(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day))}
                  className="aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all hover:bg-blue-50 relative p-1"
                  style={{
                    background: selected ? '#0891b2' : todayDay ? '#e0f2fe' : 'transparent',
                    color: selected ? 'white' : todayDay ? '#0891b2' : '#374151',
                  }}>
                  <span className="text-sm font-semibold leading-none">{day}</span>
                  {dayAppts.length > 0 && (
                    <div className="flex gap-0.5 flex-wrap justify-center">
                      {dayAppts.slice(0, 3).map((a, idx) => (
                        <div key={idx} className="w-1.5 h-1.5 rounded-full"
                          style={{ background: selected ? 'rgba(255,255,255,0.7)' : STATUS_COLOR[a.status] }} />
                      ))}
                      {dayAppts.length > 3 && (
                        <span className="text-xs leading-none" style={{ color: selected ? 'rgba(255,255,255,0.7)' : '#94a3b8' }}>
                          +{dayAppts.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-50 flex-wrap">
            {Object.entries(STATUS_LABEL).slice(0,4).map(([k, v]) => (
              <div key={k} className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLOR[k] }} />
                {v}
              </div>
            ))}
          </div>
        </div>

        {/* ── Day panel ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-50">
            <h3 className="font-cormorant text-xl font-semibold text-gray-900">
              {selectedDate.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">{selectedAppts.length} cita{selectedAppts.length !== 1 ? 's' : ''}</p>
          </div>

          <div className="p-4 space-y-3 overflow-y-auto" style={{ maxHeight: '480px' }}>
            {loading ? (
              [1,2,3].map(i => <div key={i} className="h-20 bg-gray-50 rounded-xl animate-pulse" />)
            ) : selectedAppts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-3xl mb-2">📅</p>
                <p className="text-gray-400 text-sm">Sin citas este día</p>
                <button onClick={() => setShowModal(true)}
                  className="mt-3 text-xs font-semibold px-3 py-1.5 rounded-lg"
                  style={{ background: '#e0f2fe', color: '#0891b2' }}>
                  + Agendar
                </button>
              </div>
            ) : (
              selectedAppts.map(a => (
                <AppointmentCard key={a.id} appt={a} onStatusChange={fetchMonth} />
              ))
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <NewAppointmentModal
          initialDate={selectedDate}
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false); fetchMonth() }}
        />
      )}
    </div>
  )
}
