import type { Metadata } from 'next'
import { Outfit, Cormorant_Garamond } from 'next/font/google'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  weight: ['300', '400', '500', '600', '700'],
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  title: 'MediCore — Gestión Clínica',
  description: 'Plataforma universal de gestión para clínicas médicas',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${outfit.variable} ${cormorant.variable}`}>
      <body className="font-outfit antialiased">{children}</body>
    </html>
  )
}
