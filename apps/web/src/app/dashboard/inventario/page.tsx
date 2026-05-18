'use client'

import { useEffect, useState, useCallback } from 'react'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'
const auth = () => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('mc_access_token')}` })
const fmt  = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n)

const CATEGORIES: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  MEDICATION:  { label: 'Medicamento',  color: '#dc2626', bg: '#fef2f2', icon: '💊' },
  CONSUMABLE:  { label: 'Consumible',   color: '#0891b2', bg: '#e0f2fe', icon: '🧴' },
  EQUIPMENT:   { label: 'Equipo',       color: '#7c3aed', bg: '#f5f3ff', icon: '🔧' },
  OFFICE:      { label: 'Oficina',      color: '#d97706', bg: '#fefce8', icon: '📎' },
  OTHER:       { label: 'Otro',         color: '#64748b', bg: '#f8fafc', icon: '📦' },
}

// ─── Item Modal ───────────────────────────────
function ItemModal({ item, onClose, onSaved }: {
  item?: any; onClose: () => void; onSaved: () => void
}) {
  const [form, setForm] = useState({
    name: item?.name ?? '', description: item?.description ?? '',
    category: item?.category ?? 'CONSUMABLE', sku: item?.sku ?? '',
    quantity: item?.quantity ?? 0, minQuantity: item?.minQuantity ?? 5,
    unit: item?.unit ?? 'pza', unitPrice: item?.unitPrice ?? '',
    supplier: item?.supplier ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const isEdit = !!item

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.unitPrice) { setError('Nombre y precio son obligatorios'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`${API}/api/v1/inventory${isEdit ? `/${item.id}` : ''}`, {
        method: isEdit ? 'PATCH' : 'POST', headers: auth(),
        body: JSON.stringify({ ...form, quantity: Number(form.quantity), minQuantity: Number(form.minQuantity), unitPrice: Number(form.unitPrice) }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error?.message)
      onSaved()
    } catch (err: any) { setError(err.message ?? 'Error al guardar') }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="font-cormorant text-2xl font-semibold text-gray-900">
              {isEdit ? 'Editar producto' : 'Nuevo producto'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Insumos y materiales del consultorio</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100">✕</button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Nombre *</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Ej. Guantes de látex (caja)" className="mc-input"/>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Categoría</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="mc-input">
                {Object.entries(CATEGORIES).map(([k, v]) => (
                  <option key={k} value={k}>{v.icon} {v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">SKU / Código</label>
              <input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                placeholder="MED-001" className="mc-input"/>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Stock actual</label>
              <input type="number" min="0" value={form.quantity}
                onChange={e => setForm(f => ({ ...f, quantity: +e.target.value }))} className="mc-input"/>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Stock mínimo</label>
              <input type="number" min="0" value={form.minQuantity}
                onChange={e => setForm(f => ({ ...f, minQuantity: +e.target.value }))} className="mc-input"/>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Unidad</label>
              <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className="mc-input">
                {['pza','caja','ml','litro','gramo','kg','rollo','par','sobre','cartucho'].map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Precio unitario *</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                <input type="number" min="0" step="0.01" value={form.unitPrice}
                  onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value }))}
                  placeholder="0.00" className="mc-input pl-7"/>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Proveedor</label>
              <input value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}
                placeholder="Nombre del proveedor" className="mc-input"/>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Descripción</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Descripción opcional" className="mc-input"/>
          </div>

          {error && <div className="p-3 rounded-lg text-sm" style={{ background: '#fef2f2', color: '#dc2626' }}>⚠️ {error}</div>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold"
              style={{ background: '#f1f5f9', color: '#64748b' }}>Cancelar</button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #0891b2, #00c8e0)' }}>
              {loading ? 'Guardando...' : isEdit ? 'Actualizar' : '+ Agregar producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Movement Modal ───────────────────────────
function MovementModal({ item, onClose, onSaved }: { item: any; onClose: () => void; onSaved: () => void }) {
  const [type,     setType]     = useState<'IN'|'OUT'|'ADJUSTMENT'>('IN')
  const [quantity, setQuantity] = useState('')
  const [reason,   setReason]   = useState('')
  const [loading,  setLoading]  = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!quantity) return
    setLoading(true)
    try {
      await fetch(`${API}/api/v1/inventory/${item.id}/movement`, {
        method: 'POST', headers: auth(),
        body: JSON.stringify({ type, quantity: Number(quantity), reason }),
      })
      onSaved()
    } finally { setLoading(false) }
  }

  const newQty = type === 'IN'
    ? item.quantity + Number(quantity || 0)
    : type === 'OUT'
    ? Math.max(0, item.quantity - Number(quantity || 0))
    : Number(quantity || 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="font-cormorant text-xl font-semibold text-gray-900">Ajuste de stock</h2>
            <p className="text-xs text-gray-500 mt-0.5">{item.name}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100">✕</button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          {/* Type selector */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { v: 'IN',         l: '+ Entrada',   c: '#059669', bg: '#dcfce7' },
              { v: 'OUT',        l: '- Salida',     c: '#dc2626', bg: '#fef2f2' },
              { v: 'ADJUSTMENT', l: '= Ajuste',     c: '#0891b2', bg: '#e0f2fe' },
            ].map(t => (
              <button key={t.v} type="button"
                onClick={() => setType(t.v as any)}
                className="py-2.5 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: type === t.v ? t.bg : '#f8fafc',
                  color: type === t.v ? t.c : '#94a3b8',
                  border: `2px solid ${type === t.v ? t.c : 'transparent'}`,
                }}>
                {t.l}
              </button>
            ))}
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Cantidad</label>
            <input type="number" min="0" value={quantity} onChange={e => setQuantity(e.target.value)}
              placeholder="0" className="mc-input text-xl font-bold text-center" autoFocus/>
          </div>

          {/* Preview */}
          <div className="flex items-center justify-between p-3 rounded-xl"
            style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
            <span className="text-sm text-gray-500">Stock actual: <strong>{item.quantity} {item.unit}</strong></span>
            <span className="text-sm font-bold" style={{ color: newQty < item.minQuantity ? '#dc2626' : '#059669' }}>
              → {newQty} {item.unit}
            </span>
          </div>

          {/* Reason */}
          <input value={reason} onChange={e => setReason(e.target.value)}
            placeholder="Motivo (opcional)" className="mc-input"/>

          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl text-sm font-semibold"
              style={{ background: '#f1f5f9', color: '#64748b' }}>Cancelar</button>
            <button type="submit" disabled={loading || !quantity}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, #0891b2, #00c8e0)' }}>
              {loading ? '...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────
export default function InventarioPage() {
  const [items,      setItems]      = useState<any[]>([])
  const [total,      setTotal]      = useState(0)
  const [loading,    setLoading]    = useState(true)
  const [search,     setSearch]     = useState('')
  const [catFilter,  setCatFilter]  = useState('')
  const [lowFilter,  setLowFilter]  = useState(false)
  const [showAdd,    setShowAdd]    = useState(false)
  const [editItem,   setEditItem]   = useState<any>(null)
  const [moveItem,   setMoveItem]   = useState<any>(null)

  const fetchItems = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search)         params.set('search',   search)
      if (catFilter)      params.set('category',  catFilter)
      if (lowFilter)      params.set('lowStock',  'true')
      const res  = await fetch(`${API}/api/v1/inventory?${params}`, { headers: auth() })
      const data = await res.json()
      if (data.success) { setItems(data.data); setTotal(data.meta.total) }
    } finally { setLoading(false) }
  }, [search, catFilter, lowFilter])

  useEffect(() => {
    const t = setTimeout(fetchItems, search ? 350 : 0)
    return () => clearTimeout(t)
  }, [fetchItems])

  const lowCount = items.filter(i => i.isLowStock).length
  const totalValue = items.reduce((s, i) => s + (i.quantity * Number(i.unitPrice)), 0)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-cormorant text-4xl font-semibold text-gray-900">Inventario</h1>
          <p className="text-sm text-gray-500 mt-1">{total} producto{total !== 1 ? 's' : ''} · Valor total: <strong>{fmt(totalValue)}</strong></p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:shadow-lg transition-all"
          style={{ background: 'linear-gradient(135deg, #0891b2, #00c8e0)' }}>
          + Nuevo producto
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: '#e0f2fe' }}>📦</div>
            <div className="w-2 h-2 rounded-full" style={{ background: '#0891b2' }}/>
          </div>
          <p className="font-cormorant text-3xl font-bold text-gray-900">{total}</p>
          <p className="text-xs text-gray-500 mt-1">Productos activos</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: lowCount > 0 ? '#fef2f2' : '#dcfce7' }}>
              {lowCount > 0 ? '⚠️' : '✅'}
            </div>
            <div className="w-2 h-2 rounded-full" style={{ background: lowCount > 0 ? '#ef4444' : '#22c55e' }}/>
          </div>
          <p className="font-cormorant text-3xl font-bold text-gray-900">{lowCount}</p>
          <p className="text-xs text-gray-500 mt-1">Bajo stock mínimo</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ background: '#f5f3ff' }}>💰</div>
            <div className="w-2 h-2 rounded-full" style={{ background: '#7c3aed' }}/>
          </div>
          <p className="font-cormorant text-3xl font-bold text-gray-900">{fmt(totalValue)}</p>
          <p className="text-xs text-gray-500 mt-1">Valor en inventario</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        {/* Filters */}
        <div className="p-5 border-b border-gray-50 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input placeholder="Buscar producto..." value={search}
              onChange={e => { setSearch(e.target.value) }}
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-cyan-400"/>
          </div>
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none">
            <option value="">Todas las categorías</option>
            {Object.entries(CATEGORIES).map(([k, v]) => (
              <option key={k} value={k}>{v.icon} {v.label}</option>
            ))}
          </select>
          <button onClick={() => setLowFilter(f => !f)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: lowFilter ? '#fef2f2' : '#f8fafc',
              color: lowFilter ? '#dc2626' : '#64748b',
              border: `1px solid ${lowFilter ? '#fecaca' : '#e2e8f0'}`,
            }}>
            ⚠️ Solo stock bajo {lowCount > 0 && `(${lowCount})`}
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                {['Producto','Categoría','Stock','Mínimo','Precio unit.','Valor total','Proveedor',''].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400 border-b border-gray-50">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({length:4}).map((_,i) => (
                  <tr key={i}>{Array.from({length:8}).map((_,j) => (
                    <td key={j} className="px-5 py-3">
                      <div className="h-4 bg-gray-100 rounded animate-pulse" style={{width: j===0?160:80}}/>
                    </td>
                  ))}</tr>
                ))
              ) : items.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-16 text-center">
                  <p className="text-4xl mb-3">📦</p>
                  <p className="text-gray-500 text-sm">{search || catFilter || lowFilter ? 'Sin resultados' : 'No hay productos en el inventario'}</p>
                  {!search && !catFilter && !lowFilter && (
                    <button onClick={() => setShowAdd(true)}
                      className="mt-4 text-sm font-semibold px-4 py-2 rounded-lg"
                      style={{ background: '#e0f2fe', color: '#0891b2' }}>
                      + Agregar primer producto
                    </button>
                  )}
                </td></tr>
              ) : items.map(item => {
                const cat = CATEGORIES[item.category] ?? CATEGORIES.OTHER
                const stockPct = item.minQuantity > 0 ? (item.quantity / item.minQuantity) * 100 : 100
                return (
                  <tr key={item.id} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors group">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {item.isLowStock && (
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#ef4444' }}
                            title="Stock bajo mínimo"/>
                        )}
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{item.name}</p>
                          {item.sku && <p className="text-xs text-gray-400 font-mono">{item.sku}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{ background: cat.bg, color: cat.color }}>
                        {cat.icon} {cat.label}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div>
                        <p className="text-sm font-bold"
                          style={{ color: item.isLowStock ? '#dc2626' : '#0f172a' }}>
                          {item.quantity} <span className="text-xs font-normal text-gray-400">{item.unit}</span>
                        </p>
                        {/* Mini stock bar */}
                        <div className="w-16 h-1.5 bg-gray-100 rounded-full mt-1 overflow-hidden">
                          <div className="h-full rounded-full"
                            style={{
                              width: `${Math.min(100, stockPct)}%`,
                              background: stockPct < 100 ? '#ef4444' : '#22c55e',
                            }}/>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-500">{item.minQuantity} {item.unit}</td>
                    <td className="px-5 py-3 text-sm font-medium text-gray-700">{fmt(item.unitPrice)}</td>
                    <td className="px-5 py-3 text-sm font-bold" style={{ color: '#0891b2' }}>
                      {fmt(item.quantity * Number(item.unitPrice))}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400">{item.supplier ?? '—'}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setMoveItem(item)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                          style={{ background: '#e0f2fe', color: '#0891b2' }}>
                          ± Stock
                        </button>
                        <button onClick={() => setEditItem(item)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold"
                          style={{ background: '#f1f5f9', color: '#64748b' }}>
                          ✏️
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Low stock alert banner */}
        {lowCount > 0 && !lowFilter && (
          <div className="mx-5 mb-5 mt-2 p-4 rounded-xl flex items-center gap-3"
            style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
            <span className="text-xl">⚠️</span>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: '#dc2626' }}>
                {lowCount} producto{lowCount !== 1 ? 's' : ''} con stock bajo el mínimo
              </p>
              <p className="text-xs" style={{ color: '#f87171' }}>Revisa y repone el inventario pronto</p>
            </div>
            <button onClick={() => setLowFilter(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: '#fee2e2', color: '#dc2626' }}>
              Ver productos →
            </button>
          </div>
        )}
      </div>

      {showAdd  && <ItemModal onClose={() => setShowAdd(false)}  onSaved={() => { setShowAdd(false);  fetchItems() }}/>}
      {editItem && <ItemModal item={editItem} onClose={() => setEditItem(null)} onSaved={() => { setEditItem(null); fetchItems() }}/>}
      {moveItem && <MovementModal item={moveItem} onClose={() => setMoveItem(null)} onSaved={() => { setMoveItem(null); fetchItems() }}/>}
    </div>
  )
}
