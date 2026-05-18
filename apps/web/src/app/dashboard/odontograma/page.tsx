'use client'

import { useEffect, useState, useCallback } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
const auth = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('mc_access_token')}` })

// ─── Conditions ───────────────────────────────
const CONDS = [
  { key: 'sano',       label: 'Sano',                color: '#ffffff', ring: '#d1d5db', text: '#6b7280' },
  { key: 'caries',     label: 'Caries',              color: '#fca5a5', ring: '#ef4444', text: '#dc2626' },
  { key: 'obturado',   label: 'Obturado',            color: '#93c5fd', ring: '#3b82f6', text: '#1d4ed8' },
  { key: 'corona',     label: 'Corona',              color: '#fcd34d', ring: '#f59e0b', text: '#92400e' },
  { key: 'endodoncia', label: 'Endodoncia',          color: '#86efac', ring: '#22c55e', text: '#166534' },
  { key: 'extraccion', label: 'Extracción ind.',     color: '#fdba74', ring: '#f97316', text: '#c2410c' },
  { key: 'extraido',   label: 'Extraído',            color: '#e2e8f0', ring: '#9ca3af', text: '#4b5563' },
  { key: 'fractura',   label: 'Fractura',            color: '#c4b5fd', ring: '#8b5cf6', text: '#6d28d9' },
  { key: 'puente',     label: 'Puente',              color: '#f9a8d4', ring: '#ec4899', text: '#be185d' },
]
const COND = Object.fromEntries(CONDS.map(c => [c.key, c]))

// Tooth type by FDI last digit
const toothType = (n: number) => {
  const d = n % 10
  if (d <= 2) return 'incisor'
  if (d === 3) return 'canine'
  if (d <= 5) return 'premolar'
  return 'molar'
}

// Sizes [totalW, totalH, centerW, centerH]
const SIZES: Record<string, [number,number,number,number]> = {
  molar:    [40, 37, 15, 14],
  premolar: [33, 33, 12, 12],
  canine:   [26, 30,  9,  9],
  incisor:  [21, 29,  7,  8],
}

// Surfaces config
const SURFACES = [
  { key: 'V', label: 'Vestibular' },
  { key: 'L', label: 'Lingual' },
  { key: 'M', label: 'Mesial' },
  { key: 'D', label: 'Distal' },
  { key: 'O', label: 'Oclusal' },
]

// FDI rows (upper: right→left center | center→left)
const UPPER = [[18,17,16,15,14,13,12,11],[21,22,23,24,25,26,27,28]]
const LOWER = [[48,47,46,45,44,43,42,41],[31,32,33,34,35,36,37,38]]

// ─── Tooth Icon ───────────────────────────────
function ToothIcon({
  number, records, selSurface, onSurface,
}: {
  number: number
  records: any[]
  selSurface: string | null
  onSurface: (surface: string) => void
}) {
  const type = toothType(number)
  const [tw, th, cw, ch] = SIZES[type]
  const cx = (tw - cw) / 2
  const cy = (th - ch) / 2

  const extracted = records.find(r => r.condition === 'extraido')

  const getColor = (surface: string) => {
    const r = records.find(rec => rec.surface === surface)
    if (r) return COND[r.condition]?.color ?? '#fff'
    const gen = records.find(rec => !rec.surface && rec.condition !== 'extraido')
    if (gen) return COND[gen.condition]?.color ?? '#fff'
    return '#fff'
  }

  const getBorder = (surface: string) => {
    const r = records.find(rec => rec.surface === surface)
    if (r) return COND[r.condition]?.ring ?? '#d1d5db'
    const gen = records.find(rec => !rec.surface && rec.condition !== 'extraido')
    if (gen) return COND[gen.condition]?.ring ?? '#d1d5db'
    return '#d1d5db'
  }

  const isSel = (s: string) => selSurface === s

  const surfaces = [
    { key: 'V', points: `0,0 ${tw},0 ${cx+cw},${cy} ${cx},${cy}` },
    { key: 'L', points: `0,${th} ${tw},${th} ${cx+cw},${cy+ch} ${cx},${cy+ch}` },
    { key: 'M', points: `0,0 0,${th} ${cx},${cy+ch} ${cx},${cy}` },
    { key: 'D', points: `${tw},0 ${tw},${th} ${cx+cw},${cy+ch} ${cx+cw},${cy}` },
  ]

  return (
    <svg width={tw} height={th} style={{ display: 'block', cursor: 'pointer' }}>
      {extracted ? (
        <>
          <rect x={0.5} y={0.5} width={tw-1} height={th-1} rx={type==='molar'?5:4}
            fill="#f3f4f6" stroke="#d1d5db" strokeWidth={1}/>
          <line x1={5} y1={5} x2={tw-5} y2={th-5} stroke="#9ca3af" strokeWidth={1.5} strokeLinecap="round"/>
          <line x1={tw-5} y1={5} x2={5} y2={th-5} stroke="#9ca3af" strokeWidth={1.5} strokeLinecap="round"/>
        </>
      ) : (
        <>
          {/* Outer border */}
          <rect x={0} y={0} width={tw} height={th} rx={type==='molar'?5:4}
            fill="#f9f9f9" stroke="#e5e7eb" strokeWidth={0.5}/>

          {/* 4 trapezoidal surfaces */}
          {surfaces.map(s => (
            <polygon key={s.key} points={s.points}
              fill={getColor(s.key)}
              stroke={isSel(s.key) ? '#0891b2' : getBorder(s.key)}
              strokeWidth={isSel(s.key) ? 1.5 : 0.5}
              onClick={() => onSurface(s.key)}
              style={{ cursor: 'pointer', filter: isSel(s.key) ? 'brightness(0.92)' : 'none' }}
            />
          ))}

          {/* Center (Occlusal) */}
          <rect x={cx} y={cy} width={cw} height={ch}
            fill={getColor('O')}
            stroke={isSel('O') ? '#0891b2' : getBorder('O')}
            strokeWidth={isSel('O') ? 1.5 : 0.5}
            onClick={() => onSurface('O')}
            style={{ cursor: 'pointer', filter: isSel('O') ? 'brightness(0.88)' : 'none' }}
          />

          {/* Selected surface highlight overlay */}
          {selSurface && (
            <rect x={0} y={0} width={tw} height={th} rx={type==='molar'?5:4}
              fill="none" stroke="#0891b2" strokeWidth={2}/>
          )}

          {/* Condition dot (top-right) if has records */}
          {records.length > 0 && (
            <circle cx={tw-3.5} cy={3.5} r={2.5}
              fill={COND[records.find(r=>!r.surface)?.condition ?? records[0]?.condition]?.ring ?? '#94a3b8'}/>
          )}
        </>
      )}
    </svg>
  )
}

// ─── Tooth Cell (icon + number) ───────────────
function ToothCell({
  number, records, selected, selSurface, onClick, onSurface, isUpper,
}: {
  number: number; records: any[]; selected: boolean
  selSurface: string | null; onClick: () => void; onSurface: (s: string) => void; isUpper: boolean
}) {
  const type = toothType(number)
  const [tw] = SIZES[type]

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, minWidth: tw }}
      onClick={onClick}
    >
      {isUpper && (
        <span style={{
          fontSize: 9, fontFamily: 'monospace', fontWeight: selected ? 700 : 400,
          color: selected ? '#0891b2' : '#9ca3af', letterSpacing: '-0.02em',
        }}>{number}</span>
      )}
      <div style={{
        padding: 2, borderRadius: 6,
        background: selected ? 'rgba(8,145,178,0.08)' : 'transparent',
        border: `1px solid ${selected ? '#bae6fd' : 'transparent'}`,
        transition: 'all 0.15s',
      }}>
        <ToothIcon number={number} records={records} selSurface={selected ? selSurface : null} onSurface={onSurface}/>
      </div>
      {!isUpper && (
        <span style={{
          fontSize: 9, fontFamily: 'monospace', fontWeight: selected ? 700 : 400,
          color: selected ? '#0891b2' : '#9ca3af',
        }}>{number}</span>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────
export default function OdontogramaPage() {
  const [patients, setPatients]   = useState<any[]>([])
  const [selPat,   setSelPat]     = useState<any>(null)
  const [records,  setRecords]    = useState<any[]>([])
  const [selTooth, setSelTooth]   = useState<number|null>(null)
  const [selSurf,  setSelSurf]    = useState<string|null>(null)
  const [condition,setCondition]  = useState('caries')
  const [notes,    setNotes]      = useState('')
  const [loading,  setLoading]    = useState(false)
  const [saving,   setSaving]     = useState(false)
  const [search,   setSearch]     = useState('')

  useEffect(() => {
    fetch(`${API}/api/v1/patients?limit=100`, { headers: auth() })
      .then(r => r.json()).then(d => { if (d.success) setPatients(d.data) })
  }, [])

  const load = useCallback(async (pid: string) => {
    setLoading(true)
    try {
      const r = await fetch(`${API}/api/v1/plugins/odontologia/${pid}`, { headers: auth() })
      const d = await r.json()
      if (d.success) setRecords(d.data.records)
    } finally { setLoading(false) }
  }, [])

  const selectPat = (p: any) => { setSelPat(p); setSelTooth(null); setSelSurf(null); load(p.id) }

  const selectTooth = (n: number) => {
    if (selTooth === n) { setSelTooth(null); setSelSurf(null); return }
    setSelTooth(n); setSelSurf(null)
    const gen = records.find(r => r.toothNumber === n && !r.surface)
    setCondition(gen?.condition ?? 'caries'); setNotes(gen?.notes ?? '')
  }

  const selectSurface = (tooth: number, surface: string) => {
    setSelTooth(tooth); setSelSurf(surface)
    const r = records.find(rec => rec.toothNumber === tooth && rec.surface === surface)
    const gen = records.find(rec => rec.toothNumber === tooth && !rec.surface)
    setCondition(r?.condition ?? gen?.condition ?? 'caries')
    setNotes(r?.notes ?? '')
  }

  const save = async () => {
    if (!selPat || !selTooth) return
    setSaving(true)
    try {
      await fetch(`${API}/api/v1/plugins/odontologia/${selPat.id}`, {
        method: 'POST', headers: auth(),
        body: JSON.stringify({ toothNumber: selTooth, surface: selSurf ?? '', condition, notes }),
      })
      await load(selPat.id)
    } finally { setSaving(false) }
  }

  const tr = (n: number) => records.filter(r => r.toothNumber === n)

  // Summary counts
  const summary = CONDS.slice(1).map(c => ({
    ...c, count: [...new Set(records.filter(r => r.condition === c.key).map(r => r.toothNumber))].length
  })).filter(c => c.count > 0)

  const filtered = patients.filter(p =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(search.toLowerCase())
  )

  const toothRow = (nums: number[], isUpper: boolean) => (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {nums.map(n => (
        <ToothCell key={n} number={n} records={tr(n)} isUpper={isUpper}
          selected={selTooth === n}
          selSurface={selTooth === n ? selSurf : null}
          onClick={() => selectTooth(n)}
          onSurface={(s) => selectSurface(n, s)}
        />
      ))}
    </div>
  )

  const divider = (
    <div style={{ width: 1, height: 48, background: '#e2e8f0', flexShrink: 0 }}/>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f8fafc' }}>

      {/* ── Patient sidebar ── */}
      <div style={{ width: 210, background: '#fff', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '20px 14px 10px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#9ca3af', marginBottom: 10 }}>Pacientes</p>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
            style={{ width: '100%', padding: '7px 11px', fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8, outline: 'none', background: '#f9fafb', boxSizing: 'border-box' }}/>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 16px' }}>
          {filtered.map(p => (
            <button key={p.id} onClick={() => selectPat(p)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 8px',
              borderRadius: 9, marginBottom: 2, cursor: 'pointer', textAlign: 'left',
              background: selPat?.id===p.id ? '#eff6ff' : 'transparent',
              border: `1px solid ${selPat?.id===p.id ? '#bfdbfe' : 'transparent'}`,
            }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#0891b2,#00c8e0)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                {p.firstName[0]}{p.lastName[0]}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.firstName} {p.lastName}</p>
                <p style={{ fontSize: 10, color: '#9ca3af', margin: 0 }}>
                  {records.filter(r=>r.patientId===p.id).length} reg.
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Center ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '16px 28px', borderBottom: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 21, fontWeight: 600, color: '#111827', margin: 0 }}>
              Odontograma
              {selPat && <span style={{ color: '#0891b2', fontWeight: 400, marginLeft: 8 }}>— {selPat.firstName} {selPat.lastName}</span>}
            </h1>
            <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0', fontFamily: 'monospace' }}>
              FDI · Vista oclusal · {records.length} registros{loading ? ' · Cargando...' : ''}
            </p>
          </div>
          {selTooth && selSurf && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: '#eff6ff', borderRadius: 20, border: '1px solid #bfdbfe' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 11, fontWeight: 700, color: '#0891b2' }}>
                D{selTooth} · Sup. {selSurf}
              </span>
              <span style={{ fontSize: 11, color: '#6b7280' }}>
                — {SURFACES.find(s=>s.key===selSurf)?.label}
              </span>
            </div>
          )}
        </div>

        {/* Odontogram area */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
          {!selPat ? (
            <div style={{ textAlign: 'center', color: '#d1d5db' }}>
              <div style={{ fontSize: 52, marginBottom: 12 }}>🦷</div>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#9ca3af', margin: 0 }}>Selecciona un paciente</p>
              <p style={{ fontSize: 13, color: '#d1d5db', marginTop: 4 }}>para ver y editar su odontograma</p>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', padding: '32px 24px', boxShadow: '0 1px 12px rgba(0,0,0,0.06)', width: '100%', overflowX: 'auto' }}>

              {/* UPPER JAW */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ flex: 1, height: 1, background: '#f3f4f6' }}/>
                  <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#d1d5db' }}>Superior — Maxilar</span>
                  <div style={{ flex: 1, height: 1, background: '#f3f4f6' }}/>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 8, minWidth: 680 }}>
  {toothRow(UPPER[0], true)}
  {divider}
  {toothRow(UPPER[1], true)}
</div>
              </div>

              {/* Labels row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', margin: '0 0 20px' }}>
                <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#d1d5db', letterSpacing: '0.1em' }}>← DERECHA</span>
                <div style={{ borderTop: '1px dashed #e5e7eb', flex: 1, margin: '4px 12px 0' }}/>
                <span style={{ fontSize: 9, fontFamily: 'monospace', color: '#d1d5db', letterSpacing: '0.1em' }}>IZQUIERDA →</span>
              </div>

              {/* LOWER JAW */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: 8, minWidth: 680 }}>
  {toothRow(LOWER[0], true)}
  {divider}
  {toothRow(LOWER[1], true)}
</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
                  <div style={{ flex: 1, height: 1, background: '#f3f4f6' }}/>
                  <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#d1d5db' }}>Inferior — Mandíbula</span>
                  <div style={{ flex: 1, height: 1, background: '#f3f4f6' }}/>
                </div>
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 24, paddingTop: 16, borderTop: '1px solid #f3f4f6' }}>
                {CONDS.map(c => (
                  <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 14, height: 14, borderRadius: 3, background: c.color, border: `1.5px solid ${c.ring}` }}/>
                    <span style={{ fontSize: 10, color: '#9ca3af' }}>{c.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Summary bar */}
        {summary.length > 0 && (
          <div style={{ padding: '12px 28px', borderTop: '1px solid #e5e7eb', background: '#fff', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0, overflowX: 'auto' }}>
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', flexShrink: 0 }}>Resumen:</span>
            {summary.map(c => (
              <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: `${c.ring}15`, border: `1px solid ${c.ring}30`, flexShrink: 0 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: c.color, border: `1.5px solid ${c.ring}` }}/>
                <span style={{ fontSize: 11, fontWeight: 600, color: c.text }}>{c.count} {c.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Edit Panel ── */}
      <div style={{ width: 248, background: '#fff', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {!selTooth ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 12 }}>👆</div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#374151', margin: 0 }}>Selecciona un diente</p>
            <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, lineHeight: 1.5 }}>Luego haz click en una superficie para registrar su condición</p>
            <div style={{ marginTop: 20, padding: '12px 14px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e5e7eb', textAlign: 'left', width: '100%' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Superficies</p>
              {SURFACES.map(s => (
                <div key={s.key} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontFamily: 'monospace', fontWeight: 700, color: '#0891b2', width: 12 }}>{s.key}</span>
                  <span style={{ fontSize: 10, color: '#6b7280' }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
            {/* Tooth header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#0891b2,#00c8e0)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'monospace', fontSize: 15, fontWeight: 800 }}>
                {selTooth}
              </div>
              <div>
                <p style={{ fontSize: 15, fontFamily: 'Georgia, serif', fontWeight: 600, color: '#111827', margin: 0 }}>Diente {selTooth}</p>
                <p style={{ fontSize: 10, color: '#9ca3af', margin: 0, textTransform: 'capitalize' }}>
                  {toothType(selTooth)}{selSurf ? ` · Sup. ${selSurf}` : ' · Sin superficie'}
                </p>
              </div>
            </div>

            {/* Surface selector */}
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', marginBottom: 8 }}>Superficie</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, marginBottom: 16 }}>
              {[{v:'',l:'General'},...SURFACES].map(s => (
                <button key={s.v} onClick={() => { setSelSurf(s.v || null); const r=records.find(rec=>rec.toothNumber===selTooth&&rec.surface===(s.v||null)); setCondition(r?.condition??'caries'); setNotes(r?.notes??'') }}
                  style={{
                    padding: '6px 3px', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                    background: (selSurf??'') === s.v ? '#0891b2' : '#f9fafb',
                    color: (selSurf??'') === s.v ? '#fff' : '#6b7280',
                    border: `1px solid ${(selSurf??'') === s.v ? '#0891b2' : '#e5e7eb'}`,
                  }}>
                  {s.v || s.l}
                </button>
              ))}
            </div>

            {/* Condition selector */}
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', marginBottom: 8 }}>Condición</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 14 }}>
              {CONDS.map(c => (
                <button key={c.key} onClick={() => setCondition(c.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 9, padding: '7px 10px', borderRadius: 8, cursor: 'pointer', textAlign: 'left', transition: 'all 0.12s',
                  background: condition === c.key ? '#eff6ff' : '#fafafa',
                  border: `1.5px solid ${condition === c.key ? '#bfdbfe' : 'transparent'}`,
                }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, background: c.color, border: `1.5px solid ${c.ring}`, flexShrink: 0 }}/>
                  <span style={{ fontSize: 11.5, fontWeight: condition === c.key ? 700 : 400, color: condition === c.key ? '#0891b2' : '#4b5563' }}>
                    {c.label}
                  </span>
                  {condition === c.key && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#0891b2' }}>✓</span>}
                </button>
              ))}
            </div>

            {/* Notes */}
            <input placeholder="Notas..." value={notes} onChange={e => setNotes(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8, outline: 'none', marginBottom: 12, boxSizing: 'border-box', background: '#fafafa' }}/>

            <button onClick={save} disabled={saving || !selPat} style={{
              width: '100%', padding: '11px', borderRadius: 9, fontSize: 13, fontWeight: 700,
              color: saving ? '#9ca3af' : '#fff', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
              background: saving ? '#f3f4f6' : 'linear-gradient(135deg,#0891b2,#00c8e0)',
              boxShadow: saving ? 'none' : '0 2px 12px rgba(8,145,178,0.3)',
            }}>
              {saving ? 'Guardando...' : '✓ Guardar'}
            </button>

            {/* Current records for this tooth */}
            {records.filter(r => r.toothNumber === selTooth).length > 0 && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #f3f4f6' }}>
                <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#9ca3af', marginBottom: 8 }}>Registros</p>
                {records.filter(r => r.toothNumber === selTooth).map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 0', borderBottom: '1px solid #f9fafb' }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: COND[r.condition]?.color, border: `1.5px solid ${COND[r.condition]?.ring}`, flexShrink: 0 }}/>
                    <span style={{ fontSize: 11, color: '#374151' }}>
                      {r.surface ? `Sup. ${r.surface} · ` : 'General · '}{COND[r.condition]?.label}
                    </span>
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