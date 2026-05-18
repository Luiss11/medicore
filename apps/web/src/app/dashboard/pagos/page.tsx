'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
function authHeaders() {
  const t = localStorage.getItem('mc_access_token')
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)

const METHOD_LABEL: Record<string, string> = {
  CASH: '💵 Efectivo', DEBIT_CARD: '💳 Débito',
  CREDIT_CARD: '💳 Crédito', TRANSFER: '🏦 Transferencia',
  INSURANCE: '🏥 Seguro', OTHER: 'Otro',
}
const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  PAID:      { bg: '#dcfce7', text: '#15803d', label: '✓ Pagado' },
  PENDING:   { bg: '#fef9c3', text: '#854d0e', label: '⏳ Pendiente' },
  PARTIAL:   { bg: '#dbeafe', text: '#1d4ed8', label: '◑ Parcial' },
  REFUNDED:  { bg: '#f3e8ff', text: '#7e22ce', label: '↩ Reembolsado' },
  CANCELLED: { bg: '#fee2e2', text: '#dc2626', label: '✕ Cancelado' },
}

function PaymentModal({ onClose, onSaved }: { onClose: () => void; onSaved: (id: string) => void }) {
  const [patients, setPatients]         = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [form, setForm] = useState({
    patientId: '', appointmentId: '', amount: '',
    discount: '0', method: 'CASH', status: 'PAID', notes: '', reference: '',
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  useEffect(() => {
    fetch(`${API}/api/v1/patients?limit=100`, { headers: authHeaders() })
      .then(r => r.json()).then(d => { if (d.success) setPatients(d.data) })
  }, [])

  useEffect(() => {
    if (!form.patientId) { setAppointments([]); return }
    fetch(`${API}/api/v1/patients/${form.patientId}/appointments`, { headers: authHeaders() })
      .then(r => r.json()).then(d => {
        if (d.success) {
          const unpaid = d.data.filter((a: any) => !a.payment || a.payment.status === 'PENDING')
          setAppointments(unpaid)
        }
      })
  }, [form.patientId])

  const selectAppointment = (apptId: string) => {
    const appt = appointments.find((a: any) => a.id === apptId)
    if (appt?.treatments?.length) {
      const total = appt.treatments.reduce((s: number, t: any) =>
        s + Number(t.appliedPrice ?? t.treatment?.basePrice ?? 0), 0)
      setForm(f => ({ ...f, appointmentId: apptId, amount: String(total) }))
    } else {
      setForm(f => ({ ...f, appointmentId: apptId }))
    }
  }

  const total = Math.max(0, Number(form.amount) - Number(form.discount))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.patientId || !form.amount) { setError('Completa paciente y monto'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API}/api/v1/payments`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({
          patientId:     form.patientId,
          appointmentId: form.appointmentId || undefined,
          amount:   Number(form.amount),
          discount: Number(form.discount),
          total,
          method:   form.method,
          status:   form.status,
          notes:    form.notes   || undefined,
          reference:form.reference || undefined,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error?.message)
      onSaved(data.data.id)
    } catch (err: any) {
      setError(err.message ?? 'Error al registrar pago')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(6,13,26,0.7)', backdropFilter: 'blur(6px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Modal header */}
        <div className="flex items-center justify-between p-6"
          style={{ background: '#060d1a', borderRadius: '16px 16px 0 0' }}>
          <div>
            <h2 className="font-cormorant text-2xl font-semibold text-white">Registrar Pago</h2>
            <p className="text-xs mt-0.5" style={{ color: '#4a7a94' }}>Nuevo cobro · genera recibo automático</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
            style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>
            ✕
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          {/* Paciente */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Paciente *</label>
            <select value={form.patientId}
              onChange={e => setForm(f => ({ ...f, patientId: e.target.value, appointmentId: '', amount: '' }))}
              className="mc-input">
              <option value="">Seleccionar paciente...</option>
              {patients.map(p => (
                <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
              ))}
            </select>
          </div>

          {appointments.length > 0 && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
                Cita — <span style={{ color: '#0891b2' }}>el monto se autocompleta</span>
              </label>
              <select value={form.appointmentId} onChange={e => selectAppointment(e.target.value)} className="mc-input">
                <option value="">Sin cita específica</option>
                {appointments.map((a: any) => (
                  <option key={a.id} value={a.id}>
                    {new Date(a.scheduledAt).toLocaleDateString('es-MX')} — Dr. {a.doctor?.firstName} {a.doctor?.lastName}
                    {a.treatments?.length ? ` · ${a.treatments.map((t:any)=>t.treatment?.name).join(', ')}` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Monto *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                <input type="number" min="0" step="0.01" placeholder="0.00"
                  value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  className="mc-input pl-7" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Descuento</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                <input type="number" min="0" step="0.01" placeholder="0.00"
                  value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))}
                  className="mc-input pl-7" />
              </div>
            </div>
          </div>

          {/* Total highlight */}
          <div className="flex items-center justify-between p-4 rounded-xl"
            style={{ background: 'linear-gradient(135deg, #e0f2fe, #f0fdf4)', border: '1px solid #bae6fd' }}>
            <span className="text-sm font-semibold text-gray-600">Total a cobrar</span>
            <span className="font-cormorant text-3xl font-bold" style={{ color: '#0891b2' }}>
              {fmt(total)}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Método</label>
              <select value={form.method} onChange={e => setForm(f => ({ ...f, method: e.target.value }))} className="mc-input">
                <option value="CASH">💵 Efectivo</option>
                <option value="DEBIT_CARD">💳 Tarjeta débito</option>
                <option value="CREDIT_CARD">💳 Tarjeta crédito</option>
                <option value="TRANSFER">🏦 Transferencia</option>
                <option value="INSURANCE">🏥 Seguro médico</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Estado</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="mc-input">
                <option value="PAID">✅ Pagado</option>
                <option value="PENDING">⏳ Pendiente</option>
                <option value="PARTIAL">🔵 Parcial</option>
              </select>
            </div>
          </div>

          <input placeholder="Referencia / Folio (opcional)" value={form.reference}
            onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} className="mc-input" />
          <input placeholder="Notas (opcional)" value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="mc-input" />

          {error && <div className="p-3 rounded-lg text-sm" style={{ background: '#fef2f2', color: '#dc2626' }}>⚠️ {error}</div>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold"
              style={{ background: '#f1f5f9', color: '#64748b' }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white"
              style={{ background: loading ? '#94a3b8' : 'linear-gradient(135deg, #0891b2, #00c8e0)' }}>
              {loading ? 'Guardando...' : '💳 Registrar pago'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Success receipt prompt ───────────────────
function ReceiptPrompt({ paymentId, onClose }: { paymentId: string; onClose: () => void }) {
  const router = useRouter()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(6,13,26,0.7)', backdropFilter: 'blur(6px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
          style={{ background: '#dcfce7' }}>✅</div>
        <h3 className="font-cormorant text-2xl font-semibold text-gray-900 mb-2">¡Pago registrado!</h3>
        <p className="text-sm text-gray-500 mb-6">El cobro se guardó correctamente.</p>
        <div className="flex flex-col gap-3">
          <button onClick={() => router.push(`/recibo/${paymentId}`)}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #0891b2, #00c8e0)' }}>
            🖨️ Ver e imprimir recibo
          </button>
          <button onClick={onClose}
            className="w-full py-3 rounded-xl text-sm font-semibold"
            style={{ background: '#f1f5f9', color: '#64748b' }}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────
export default function PagosPage() {
  const router = useRouter()
  const [payments,  setPayments]  = useState<any[]>([])
  const [summary,   setSummary]   = useState({ totalGeneral: 0, totalPaid: 0, totalPending: 0 })
  const [total,     setTotal]     = useState(0)
  const [page,      setPage]      = useState(1)
  const [filter,    setFilter]    = useState('')
  const [showModal, setShowModal] = useState(false)
  const [newPayId,  setNewPayId]  = useState<string | null>(null)
  const [loading,   setLoading]   = useState(true)
  const LIMIT = 15

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
      if (filter) params.set('status', filter)
      const res  = await fetch(`${API}/api/v1/payments?${params}`, { headers: authHeaders() })
      const data = await res.json()
      if (data.success) { setPayments(data.data); setTotal(data.meta.total); setSummary(data.summary) }
    } finally { setLoading(false) }
  }, [page, filter])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-cormorant text-4xl font-semibold text-gray-900">Pagos</h1>
          <p className="text-sm text-gray-500 mt-1">{total} registro{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:shadow-lg transition-all"
          style={{ background: 'linear-gradient(135deg, #0891b2, #00c8e0)' }}>
          + Registrar pago
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        {[
          { icon: '💳', label: 'Total facturado', value: summary.totalGeneral, color: '#0891b2', bg: '#e0f2fe' },
          { icon: '✅', label: 'Cobrado',          value: summary.totalPaid,    color: '#059669', bg: '#dcfce7' },
          { icon: '⏳', label: 'Por cobrar',       value: summary.totalPending, color: summary.totalPending > 0 ? '#d97706' : '#059669', bg: '#fef9c3' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl" style={{ background: k.bg }}>
                {k.icon}
              </div>
              <div className="w-2 h-2 rounded-full" style={{ background: k.color }} />
            </div>
            <p className="font-cormorant text-3xl font-bold text-gray-900">{fmt(k.value)}</p>
            <p className="text-xs text-gray-500 mt-1">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 p-5 border-b border-gray-50">
          <span className="text-sm font-semibold text-gray-600 mr-1">Estado:</span>
          {[
            { v: '',        l: 'Todos' },
            { v: 'PAID',    l: '✓ Pagado' },
            { v: 'PENDING', l: '⏳ Pendiente' },
            { v: 'PARTIAL', l: '◑ Parcial' },
          ].map(s => (
            <button key={s.v} onClick={() => { setFilter(s.v); setPage(1) }}
              className="px-4 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{ background: filter===s.v ? '#0891b2' : '#f1f5f9', color: filter===s.v ? 'white' : '#64748b' }}>
              {s.l}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {['Paciente','Fecha','Monto','Descuento','Total','Método','Estado',''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 border-b border-gray-50">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? Array.from({length:5}).map((_,i) => (
                <tr key={i}>{Array.from({length:8}).map((_,j) => (
                  <td key={j} className="px-5 py-3">
                    <div className="h-4 bg-gray-100 rounded animate-pulse" style={{width: j===0?140:80}} />
                  </td>
                ))}</tr>
              )) : payments.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-16 text-center">
                  <p className="text-4xl mb-3">💳</p>
                  <p className="text-gray-500 text-sm">{filter ? 'Sin resultados' : 'No hay pagos aún'}</p>
                  {!filter && (
                    <button onClick={() => setShowModal(true)}
                      className="mt-4 text-sm font-semibold px-4 py-2 rounded-lg"
                      style={{ background: '#e0f2fe', color: '#0891b2' }}>
                      + Registrar primer pago
                    </button>
                  )}
                </td></tr>
              ) : payments.map(p => (
                <tr key={p.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors group">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: 'linear-gradient(135deg,#0891b2,#00c8e0)' }}>
                        {p.patient.firstName[0]}{p.patient.lastName[0]}
                      </div>
                      <span className="text-sm font-semibold text-gray-800">{p.patient.firstName} {p.patient.lastName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">
                    {new Date(p.createdAt).toLocaleDateString('es-MX',{day:'2-digit',month:'short',year:'numeric'})}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-700 font-medium">{fmt(p.amount)}</td>
                  <td className="px-5 py-3 text-sm">
                    {Number(p.discount) > 0
                      ? <span style={{color:'#dc2626'}}>-{fmt(p.discount)}</span>
                      : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm font-bold" style={{color:'#0891b2'}}>{fmt(p.total)}</span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">{METHOD_LABEL[p.method] ?? p.method}</td>
                  <td className="px-5 py-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                      style={{ background: STATUS_STYLE[p.status]?.bg ?? '#f1f5f9', color: STATUS_STYLE[p.status]?.text ?? '#64748b' }}>
                      {STATUS_STYLE[p.status]?.label ?? p.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button onClick={() => router.push(`/recibo/${p.id}`)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: '#e0f2fe', color: '#0891b2' }}>
                      🖨️ Recibo
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {Math.ceil(total/LIMIT) > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-50">
            <p className="text-xs text-gray-400">Mostrando {((page-1)*LIMIT)+1}–{Math.min(page*LIMIT,total)} de {total}</p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
                style={{background:'#f1f5f9',color:'#475569'}}>← Anterior</button>
              <button onClick={() => setPage(p=>Math.min(Math.ceil(total/LIMIT),p+1))} disabled={page===Math.ceil(total/LIMIT)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
                style={{background:'#f1f5f9',color:'#475569'}}>Siguiente →</button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <PaymentModal
          onClose={() => setShowModal(false)}
          onSaved={(id) => { setShowModal(false); setNewPayId(id); fetchPayments() }}
        />
      )}

      {newPayId && (
        <ReceiptPrompt
          paymentId={newPayId}
          onClose={() => setNewPayId(null)}
        />
      )}
    </div>
  )
}
