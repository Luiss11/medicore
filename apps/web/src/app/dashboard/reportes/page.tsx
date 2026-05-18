'use client'

import { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
const auth = () => ({ Authorization: `Bearer ${localStorage.getItem('mc_access_token')}` })
const fmt  = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
const fmtK = (n: number) => n >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${n}`

// ─── KPI Card ─────────────────────────────────
function KPICard({ icon, label, value, sub, pct, color }: {
  icon: string; label: string; value: string; sub?: string; pct?: number; color: string
}) {
  const up = pct !== undefined && pct >= 0
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
          style={{ background: `${color}15` }}>{icon}</div>
        {pct !== undefined && (
          <span className="text-xs font-semibold px-2 py-1 rounded-full"
            style={{ background: up ? '#dcfce7' : '#fef2f2', color: up ? '#15803d' : '#dc2626' }}>
            {up ? '↑' : '↓'} {Math.abs(pct)}%
          </span>
        )}
      </div>
      <p className="font-cormorant text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1 font-medium">{label}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color }}>{sub}</p>}
    </div>
  )
}

// ─── Custom Tooltip ───────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-xl p-3">
      <p className="text-xs font-semibold text-gray-600 mb-2">{label}</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }}/>
          <span className="text-gray-500">{p.name}:</span>
          <span className="font-semibold text-gray-800">
            {p.name === 'ingresos' ? fmt(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// Status labels & colors for pie
const STATUS_CFG: Record<string, { label: string; color: string }> = {
  SCHEDULED:   { label: 'Programadas', color: '#f59e0b' },
  CONFIRMED:   { label: 'Confirmadas', color: '#3b82f6' },
  COMPLETED:   { label: 'Atendidas',   color: '#10b981' },
  CANCELLED:   { label: 'Canceladas',  color: '#ef4444' },
  NO_SHOW:     { label: 'No asistió',  color: '#f97316' },
  IN_PROGRESS: { label: 'En consulta', color: '#8b5cf6' },
}

// ─── Main Page ────────────────────────────────
export default function ReportesPage() {
  const [overview,    setOverview]    = useState<any>(null)
  const [income,      setIncome]      = useState<any[]>([])
  const [treatments,  setTreatments]  = useState<any[]>([])
  const [doctors,     setDoctors]     = useState<any[]>([])
  const [months,      setMonths]      = useState(6)
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`${API}/api/v1/reports/overview`,                    { headers: auth() }).then(r => r.json()),
      fetch(`${API}/api/v1/reports/income?months=${months}`,     { headers: auth() }).then(r => r.json()),
      fetch(`${API}/api/v1/reports/treatments`,                  { headers: auth() }).then(r => r.json()),
      fetch(`${API}/api/v1/reports/doctors`,                     { headers: auth() }).then(r => r.json()),
    ]).then(([ov, inc, tr, doc]) => {
      if (ov.success)  setOverview(ov.data)
      if (inc.success) setIncome(inc.data)
      if (tr.success)  setTreatments(tr.data)
      if (doc.success) setDoctors(doc.data)
    }).finally(() => setLoading(false))
  }, [months])

  const pieData = overview?.citasPorEstado?.map((c: any) => ({
    name:  STATUS_CFG[c.status]?.label ?? c.status,
    value: c.count,
    color: STATUS_CFG[c.status]?.color ?? '#94a3b8',
  })) ?? []

  const totalCitas = pieData.reduce((s: number, c: any) => s + c.value, 0)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-cormorant text-4xl font-semibold text-gray-900">Reportes</h1>
          <p className="text-sm text-gray-500 mt-1">Análisis y estadísticas del consultorio</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Período:</span>
          {[3, 6, 12].map(m => (
            <button key={m} onClick={() => setMonths(m)}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{ background: months===m ? '#0891b2' : '#f1f5f9', color: months===m ? 'white' : '#64748b' }}>
              {m} meses
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-5 mb-8">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
              <div className="w-11 h-11 bg-gray-100 rounded-xl mb-4"/>
              <div className="h-8 w-20 bg-gray-100 rounded mb-2"/>
              <div className="h-3 w-28 bg-gray-50 rounded"/>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            <KPICard icon="👥" label="Pacientes activos"    value={String(overview?.totalPatients ?? 0)}
              sub={`+${overview?.newPatientsMonth ?? 0} este mes`}
              pct={overview?.newPatientsPct} color="#0891b2"/>
            <KPICard icon="📅" label="Citas este mes"       value={String(overview?.citasMonth ?? 0)}
              pct={overview?.citasPct} color="#7c3aed"/>
            <KPICard icon="💳" label="Ingresos del mes"     value={fmt(overview?.ingresosMonth ?? 0)}
              pct={overview?.ingresosPct} color="#059669"/>
            <KPICard icon="📊" label="Total citas hist."    value={String(totalCitas)}
              sub={`${pieData.find((p:any)=>p.name==='Atendidas')?.value ?? 0} atendidas`}
              color="#d97706"/>
          </div>

          {/* Charts row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

            {/* Income area chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-cormorant text-xl font-semibold text-gray-900">Ingresos & Citas</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Últimos {months} meses</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={income} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#0891b2" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#0891b2" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="gCitas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.12}/>
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false}/>
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
                  <YAxis yAxisId="left"  tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={fmtK}/>
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
                  <Tooltip content={<CustomTooltip/>}/>
                  <Area yAxisId="left"  type="monotone" dataKey="ingresos" name="ingresos"
                    stroke="#0891b2" strokeWidth={2.5} fill="url(#gIngresos)" dot={{ fill: '#0891b2', r: 3 }}/>
                  <Area yAxisId="right" type="monotone" dataKey="citas"    name="citas"
                    stroke="#7c3aed" strokeWidth={2}   fill="url(#gCitas)"   dot={{ fill: '#7c3aed', r: 3 }}/>
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-2"><div className="w-3 h-1 rounded" style={{background:'#0891b2'}}/><span className="text-xs text-gray-500">Ingresos</span></div>
                <div className="flex items-center gap-2"><div className="w-3 h-1 rounded" style={{background:'#7c3aed'}}/><span className="text-xs text-gray-500">Citas</span></div>
              </div>
            </div>

            {/* Pie chart — citas por estado */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-cormorant text-xl font-semibold text-gray-900 mb-1">Estado de citas</h2>
              <p className="text-xs text-gray-400 mb-4">Distribución total</p>
              {pieData.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Sin datos</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                        dataKey="value" stroke="none">
                        {pieData.map((entry: any, i: number) => (
                          <Cell key={i} fill={entry.color}/>
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any, n: any) => [v, n]}/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-2">
                    {pieData.map((p: any) => (
                      <div key={p.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }}/>
                          <span className="text-xs text-gray-600">{p.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-800">{p.value}</span>
                          <span className="text-xs text-gray-400">
                            {totalCitas > 0 ? Math.round((p.value/totalCitas)*100) : 0}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Charts row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Top treatments bar chart */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-cormorant text-xl font-semibold text-gray-900 mb-1">Tratamientos más realizados</h2>
              <p className="text-xs text-gray-400 mb-5">Por número de aplicaciones</p>
              {treatments.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-gray-400 text-sm">Sin datos aún</div>
              ) : (
                <div className="space-y-3">
                  {treatments.map((t, i) => {
                    const max = treatments[0]?.count ?? 1
                    const pct = Math.round((t.count / max) * 100)
                    const colors = ['#0891b2','#7c3aed','#059669','#d97706','#ec4899','#f97316','#06b6d4','#84cc16']
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700 truncate max-w-[180px]">{t.name}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400">{t.count} veces</span>
                            <span className="text-xs font-semibold" style={{ color: colors[i % colors.length] }}>{fmt(t.revenue)}</span>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: colors[i % colors.length] }}/>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Patients new per month bar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-cormorant text-xl font-semibold text-gray-900 mb-1">Pacientes nuevos</h2>
              <p className="text-xs text-gray-400 mb-4">Por mes</p>
              {income.every(d => d.pacientes === 0) ? (
                <div className="h-[220px] flex flex-col items-center justify-center text-gray-400 text-sm gap-2">
                  <span className="text-3xl">📈</span>
                  <span>Los datos aparecerán conforme uses el sistema</span>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={income} margin={{ top: 0, right: 0, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false}/>
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false}/>
                    <Tooltip content={<CustomTooltip/>}/>
                    <Bar dataKey="pacientes" name="pacientes" fill="#0891b2" radius={[6,6,0,0]} maxBarSize={40}/>
                  </BarChart>
                </ResponsiveContainer>
              )}

              {/* Doctors mini table */}
              {doctors.length > 0 && (
                <div className="mt-6 pt-5 border-t border-gray-50">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Doctores</p>
                  {doctors.map((d, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{d.name}</p>
                        <p className="text-xs text-gray-400">{d.specialty}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ color: '#0891b2' }}>{d.citasMes}</p>
                        <p className="text-xs text-gray-400">este mes</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
