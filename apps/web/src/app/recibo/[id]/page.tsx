'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
function authHeaders() {
  const t = localStorage.getItem('mc_access_token')
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)

const METHOD_LABEL: Record<string, string> = {
  CASH: 'Efectivo', DEBIT_CARD: 'Tarjeta Débito',
  CREDIT_CARD: 'Tarjeta Crédito', TRANSFER: 'Transferencia Bancaria',
  INSURANCE: 'Seguro Médico', OTHER: 'Otro',
}

export default function ReciboPagina() {
  const { id }   = useParams() as { id: string }
  const router   = useRouter()
  const [payment, setPayment] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const tenant = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('mc_tenant') ?? '{}') : {}

  useEffect(() => {
    fetch(`${API}/api/v1/payments/${id}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(d => { if (d.success) setPayment(d.data) })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full" />
    </div>
  )

  if (!payment) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-500">Recibo no encontrado</p>
    </div>
  )

  const receiptNum = payment.id.slice(-8).toUpperCase()
  const appt       = payment.appointment
  const doctor     = appt?.doctor
  const treatments = appt?.treatments ?? []

  return (
    <>
      {/* Print/action bar — hidden on print */}
      <div className="no-print fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-3 bg-white border-b border-gray-200 shadow-sm">
        <button onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          ← Volver
        </button>
        <div className="flex gap-3">
          <button onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg"
            style={{ background: 'linear-gradient(135deg, #0891b2, #00c8e0)' }}>
            🖨️ Imprimir recibo
          </button>
          <button onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ background: '#f1f5f9', color: '#475569' }}>
            📄 Guardar PDF
          </button>
        </div>
      </div>

      {/* Receipt */}
      <div className="min-h-screen pt-16 pb-12 flex items-start justify-center no-print-bg"
        style={{ background: '#f1f5f9' }}>
        <div id="receipt" className="bg-white shadow-xl mt-8 mx-4"
          style={{ width: 520, fontFamily: 'Arial, sans-serif' }}>

          {/* Header */}
          <div className="px-10 pt-10 pb-6" style={{ background: '#060d1a' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #0891b2, #00c8e0)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L12 22M2 12L22 12" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <p style={{ color: '#00c8e0', fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px' }}>
                  MediCore
                </p>
                <p style={{ color: '#4a7a94', fontSize: 11 }}>{tenant?.name ?? 'Clínica'}</p>
              </div>
            </div>
            <div className="flex items-start justify-between">
              <div>
                <p style={{ color: '#ffffff', fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px' }}>
                  RECIBO DE PAGO
                </p>
                <p style={{ color: '#4a7a94', fontSize: 12, marginTop: 2 }}>
                  Folio: <span style={{ color: '#00c8e0', fontFamily: 'monospace' }}>#{receiptNum}</span>
                </p>
              </div>
              <div className="text-right">
                <div className="inline-block px-3 py-1 rounded-full text-xs font-bold"
                  style={{
                    background: payment.status === 'PAID' ? '#dcfce7' : '#fef9c3',
                    color: payment.status === 'PAID' ? '#15803d' : '#854d0e',
                  }}>
                  {payment.status === 'PAID' ? '✓ PAGADO' : '⏳ PENDIENTE'}
                </div>
                <p style={{ color: '#4a7a94', fontSize: 11, marginTop: 6 }}>
                  {new Date(payment.createdAt).toLocaleDateString('es-MX', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Divider wave */}
          <div style={{ background: '#060d1a', height: 24, position: 'relative', overflow: 'hidden' }}>
            <svg viewBox="0 0 520 24" style={{ position: 'absolute', bottom: 0, width: '100%' }}>
              <path d="M0 0 Q130 24 260 12 Q390 0 520 12 L520 24 L0 24 Z" fill="white"/>
            </svg>
          </div>

          {/* Body */}
          <div className="px-10 py-6">

            {/* Patient + Doctor */}
            <div className="grid grid-cols-2 gap-6 mb-6 pb-6"
              style={{ borderBottom: '1px dashed #e2e8f0' }}>
              <div>
                <p style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                  Paciente
                </p>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                  {payment.patient.firstName} {payment.patient.lastName}
                </p>
              </div>
              {doctor && (
                <div>
                  <p style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                    Doctor
                  </p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                    Dr. {doctor.firstName} {doctor.lastName}
                  </p>
                  <p style={{ fontSize: 12, color: '#64748b' }}>{doctor.specialty}</p>
                </div>
              )}
            </div>

            {/* Date of service */}
            {appt && (
              <div className="mb-5 pb-5" style={{ borderBottom: '1px dashed #e2e8f0' }}>
                <p style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                  Fecha de consulta
                </p>
                <p style={{ fontSize: 14, color: '#334155' }}>
                  {new Date(appt.scheduledAt).toLocaleDateString('es-MX', {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                  })} — {new Date(appt.scheduledAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            )}

            {/* Services */}
            <div className="mb-5">
              <p style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                Servicios
              </p>
              {treatments.length > 0 ? (
                <div>
                  {treatments.map((t: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2.5"
                      style={{ borderBottom: i < treatments.length - 1 ? '1px solid #f8fafc' : 'none' }}>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#0891b2' }} />
                        <span style={{ fontSize: 14, color: '#334155', fontWeight: 500 }}>
                          {t.treatment?.name}
                        </span>
                      </div>
                      <span style={{ fontSize: 14, color: '#334155', fontWeight: 600 }}>
                        {fmt(Number(t.appliedPrice ?? t.treatment?.basePrice ?? 0))}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 14, color: '#64748b' }}>Consulta general</p>
              )}
            </div>

            {/* Totals */}
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '16px 20px' }}>
              <div className="flex justify-between mb-2">
                <span style={{ fontSize: 13, color: '#64748b' }}>Subtotal</span>
                <span style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>{fmt(Number(payment.amount))}</span>
              </div>
              {Number(payment.discount) > 0 && (
                <div className="flex justify-between mb-2">
                  <span style={{ fontSize: 13, color: '#dc2626' }}>Descuento</span>
                  <span style={{ fontSize: 13, color: '#dc2626', fontWeight: 600 }}>- {fmt(Number(payment.discount))}</span>
                </div>
              )}
              <div className="flex justify-between pt-3 mt-1" style={{ borderTop: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>TOTAL</span>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#0891b2' }}>{fmt(Number(payment.total))}</span>
              </div>
            </div>

            {/* Payment method + reference */}
            <div className="flex gap-6 mt-5">
              <div>
                <p style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>
                  Método de pago
                </p>
                <p style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>
                  {METHOD_LABEL[payment.method] ?? payment.method}
                </p>
              </div>
              {payment.reference && (
                <div>
                  <p style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>
                    Folio / Referencia
                  </p>
                  <p style={{ fontSize: 13, color: '#334155', fontWeight: 600, fontFamily: 'monospace' }}>
                    {payment.reference}
                  </p>
                </div>
              )}
              {payment.paidAt && (
                <div>
                  <p style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>
                    Pagado el
                  </p>
                  <p style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>
                    {new Date(payment.paidAt).toLocaleDateString('es-MX')}
                  </p>
                </div>
              )}
            </div>

            {payment.notes && (
              <div className="mt-4 p-3 rounded-xl" style={{ background: '#fefce8', border: '1px solid #fef08a' }}>
                <p style={{ fontSize: 12, color: '#854d0e' }}>📝 {payment.notes}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-10 py-6" style={{ background: '#f8fafc', borderTop: '1px dashed #e2e8f0' }}>
            <div className="text-center">
              <p style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>
                Gracias por su preferencia · {tenant?.name ?? 'MediCore'}
              </p>
              <p style={{ fontSize: 11, color: '#94a3b8' }}>
                Este documento es un comprobante de pago · Folio #{receiptNum}
              </p>
              <div className="flex items-center justify-center gap-1 mt-3">
                <div style={{ width: 20, height: 20, background: 'linear-gradient(135deg,#0891b2,#00c8e0)', borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L12 22M2 12L22 12" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                </div>
                <span style={{ fontSize: 12, color: '#0891b2', fontWeight: 700 }}>MediCore</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .no-print-bg { background: white !important; padding: 0 !important; }
          body { margin: 0; }
          #receipt { box-shadow: none !important; margin: 0 !important; }
        }
      `}</style>
    </>
  )
}
