import type { Metadata } from 'next'
import '../styles/globals.css'

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
      <body className="min-h-screen bg-gray-50">
        <div className="flex flex-col min-h-screen">
          {/* Header/Navbar será adicionado aqui em breve */}
          <main className="flex-1">
            {children}
          </main>
          {/* Footer será adicionado aqui em breve */}
        </div>
      </body>
    </html>
  )
}
