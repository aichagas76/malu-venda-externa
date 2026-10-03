import type { Metadata } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title: 'Malu Vendas - ASaaS de Vendas',
  description: 'Sistema de Gestão de Vendas em Nuvem',
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body style={{ minHeight: '100vh', backgroundColor: '#f8fafc', overflowX: 'hidden' }}>
        {children}
      </body>
    </html>
  )
}
