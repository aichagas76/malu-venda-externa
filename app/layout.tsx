import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' })

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
    <html lang="pt-BR" suppressHydrationWarning className={inter.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: "try{if(localStorage.getItem('tema')==='dark')document.documentElement.setAttribute('data-theme','dark')}catch(e){}" }} />
      </head>
      <body style={{ minHeight: '100vh', backgroundColor: '#f8fafc', overflowX: 'hidden' }}>
        {children}
      </body>
    </html>
  )
}
