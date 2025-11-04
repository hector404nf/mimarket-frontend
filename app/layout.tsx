import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/contexts/auth-context'
import { CartSyncWrapper } from '@/components/cart-sync-wrapper'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'MiMarket - Tu marketplace local',
  description: 'Conecta con tiendas locales y descubre productos únicos',
  generator: 'v0.app',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <AuthProvider>
          <CartSyncWrapper>
            {children}
          </CartSyncWrapper>
        </AuthProvider>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
