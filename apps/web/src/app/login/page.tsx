'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { login, saveSession, isAuthenticated } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm]       = useState({ email: '', password: '', tenantSlug: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [shake, setShake]     = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (isAuthenticated()) router.replace('/dashboard')
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    if (error) setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email || !form.password || !form.tenantSlug) {
      setError('Completa todos los campos')
      triggerShake()
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await login(form.email, form.password, form.tenantSlug)
      saveSession(res.data)
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.message ?? 'Error al iniciar sesión')
      triggerShake()
    } finally {
      setLoading(false)
    }
  }

  const triggerShake = () => {
    setShake(true)
    setTimeout(() => setShake(false), 400)
  }

  if (!mounted) return null

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT PANEL — Brand ──────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between p-14"
        style={{ background: 'linear-gradient(135deg, #060d1a 0%, #0a1628 50%, #060d1a 100%)' }}>

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(#00c8e0 1px, transparent 1px), linear-gradient(90deg, #00c8e0 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
          }} />

        {/* Glowing orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #00c8e0, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full opacity-8"
          style={{ background: 'radial-gradient(circle, #0891b2, transparent 70%)', filter: 'blur(30px)' }} />

        {/* Cross medical icon — decorative */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03]">
          <svg width="600" height="600" viewBox="0 0 100 100">
            <rect x="38" y="10" width="24" height="80" rx="4" fill="white"/>
            <rect x="10" y="38" width="80" height="24" rx="4" fill="white"/>
          </svg>
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #0891b2, #00c8e0)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L12 22M2 12L22 12" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-cormorant text-2xl font-semibold tracking-wide text-white">
              Medi<span style={{ color: '#00c8e0' }}>Core</span>
            </span>
          </div>
          <p className="text-xs tracking-[0.2em] uppercase ml-12" style={{ color: '#4a7a94' }}>
            Gestión Clínica Profesional
          </p>
        </div>

        {/* Center content */}
        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <div className="mb-6">
            <div className="w-1 h-16 rounded-full mb-8" style={{ background: 'linear-gradient(to bottom, #00c8e0, transparent)' }} />
            <h1 className="font-cormorant text-5xl font-semibold leading-tight text-white mb-6">
              La plataforma que<br/>
              <span style={{ color: '#00c8e0', fontStyle: 'italic' }}>tu clínica merece</span>
            </h1>
            <p className="text-sm leading-relaxed max-w-sm" style={{ color: '#4a7a94' }}>
              Gestión de pacientes, citas, expedientes clínicos y más.
              Diseñado para cualquier especialidad médica.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-col gap-3 mt-4">
            {[
              { icon: '🦷', label: 'Odontología' },
              { icon: '👁️', label: 'Oftalmología' },
              { icon: '🧴', label: 'Dermatología' },
              { icon: '🫀', label: 'Cardiología' },
            ].map((f, i) => (
              <div key={f.label}
                className="flex items-center gap-3 opacity-0 anim-fade-up"
                style={{ animationDelay: `${0.4 + i * 0.1}s`, animationFillMode: 'forwards' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm flex-shrink-0"
                  style={{ background: 'rgba(0,200,224,0.1)', border: '1px solid rgba(0,200,224,0.2)' }}>
                  {f.icon}
                </div>
                <span className="text-sm" style={{ color: '#6b96b0' }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="relative z-10">
          <p className="text-xs" style={{ color: '#2a4a62' }}>
            © 2026 MediCore · Todos los derechos reservados
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL — Form ──────────────────── */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-16 lg:px-20"
        style={{ background: '#f8fafc' }}>

        <div className="w-full max-w-md mx-auto">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #0891b2, #00c8e0)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L12 22M2 12L22 12" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </div>
            <span className="font-cormorant text-xl font-semibold text-gray-900">
              Medi<span style={{ color: '#0891b2' }}>Core</span>
            </span>
          </div>

          {/* Header */}
          <div className="mb-10 opacity-0 anim-fade-up" style={{ animationFillMode: 'forwards' }}>
            <h2 className="font-cormorant text-4xl font-semibold text-gray-900 mb-2">
              Bienvenido de vuelta
            </h2>
            <p className="text-sm" style={{ color: '#64748b' }}>
              Ingresa tus credenciales para continuar
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}
            className={`space-y-5 ${shake ? 'anim-shake' : ''}`}>

            {/* Tenant slug */}
            <div className="opacity-0 anim-fade-up delay-100" style={{ animationFillMode: 'forwards' }}>
              <label className="block text-xs font-semibold mb-2 tracking-wide uppercase"
                style={{ color: '#475569' }}>
                Nombre de clínica
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                    <polyline points="9 22 9 12 15 12 15 22"/>
                  </svg>
                </span>
                <input
                  name="tenantSlug"
                  type="text"
                  placeholder="clinica-sonrisa"
                  value={form.tenantSlug}
                  onChange={handleChange}
                  className={`mc-input pl-10 ${error ? 'error' : ''}`}
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Email */}
            <div className="opacity-0 anim-fade-up delay-200" style={{ animationFillMode: 'forwards' }}>
              <label className="block text-xs font-semibold mb-2 tracking-wide uppercase"
                style={{ color: '#475569' }}>
                Correo electrónico
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </span>
                <input
                  name="email"
                  type="email"
                  placeholder="doctor@clinica.mx"
                  value={form.email}
                  onChange={handleChange}
                  className={`mc-input pl-10 ${error ? 'error' : ''}`}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="opacity-0 anim-fade-up delay-300" style={{ animationFillMode: 'forwards' }}>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-semibold tracking-wide uppercase"
                  style={{ color: '#475569' }}>
                  Contraseña
                </label>
                <button type="button" className="text-xs font-medium"
                  style={{ color: '#0891b2' }}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                </span>
                <input
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  className={`mc-input pl-10 pr-12 ${error ? 'error' : ''}`}
                  autoComplete="current-password"
                />
                <button type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPass
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg text-sm"
                style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {/* Submit */}
            <div className="opacity-0 anim-fade-up delay-400" style={{ animationFillMode: 'forwards' }}>
              <button type="submit" disabled={loading} className="mc-btn mt-2">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeOpacity="0.25"/>
                      <path d="M21 12a9 9 0 00-9-9"/>
                    </svg>
                    Iniciando sesión...
                  </span>
                ) : 'Iniciar sesión →'}
              </button>
            </div>
          </form>

          {/* Demo hint */}
          <div className="mt-8 p-4 rounded-xl opacity-0 anim-fade-up delay-500"
            style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', animationFillMode: 'forwards' }}>
            <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: '#64748b' }}>
              Credenciales de demo
            </p>
            <div className="space-y-1 font-mono text-xs" style={{ color: '#475569' }}>
              <p>Clínica: <span className="font-semibold text-gray-800">clinica-sonrisa</span></p>
              <p>Email: <span className="font-semibold text-gray-800">admin@clinicasonrisa.mx</span></p>
              <p>Pass: <span className="font-semibold text-gray-800">Admin1234!</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
