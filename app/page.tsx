'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function Home() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-600">Malu Vendas</div>
          <div className="space-x-4">
            <Link href="/auth/login" className="text-gray-600 hover:text-gray-900">
              Login
            </Link>
            <Link href="/auth/signup" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              Cadastro
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Gestão de Vendas em Nuvem
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Malu Vendas é uma plataforma SaaS completa para gerenciar seus clientes,
            pedidos, produtos e equipe de vendas de forma eficiente.
          </p>

          <div className="space-x-4">
            <Link
              href="/auth/signup"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 font-semibold"
            >
              Comece Grátis
            </Link>
            <Link
              href="#features"
              className="inline-block border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50 font-semibold"
            >
              Saiba Mais
            </Link>
          </div>
        </div>

        {/* Features */}
        <section id="features" className="mt-20 grid md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Gestão de Clientes</h3>
            <p className="text-gray-600">
              Organize todas as informações de seus clientes em um único lugar com acesso rápido e seguro.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Pedidos Inteligentes</h3>
            <p className="text-gray-600">
              Crie, rastreie e gerencie pedidos com facilidade. Acompanhe o status em tempo real.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Controle de Estoque</h3>
            <p className="text-gray-600">
              Monitore seu inventário, evite rupturas de estoque e otimize suas compras.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Dashboard Analítico</h3>
            <p className="text-gray-600">
              Visualize métricas importantes e tome decisões baseadas em dados reais.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Equipe Colaborativa</h3>
            <p className="text-gray-600">
              Gerencie sua equipe de vendedores e acompanhe o desempenho de cada um.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Acesso na Nuvem</h3>
            <p className="text-gray-600">
              Acesse de qualquer lugar, a qualquer momento, em qualquer dispositivo.
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mt-20 bg-blue-600 text-white rounded-lg p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Pronto para começar?</h2>
          <p className="text-lg mb-8">
            Comece seu período de testes gratuito hoje mesmo. Sem cartão de crédito necessário.
          </p>
          <Link
            href="/auth/signup"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-gray-100 font-semibold"
          >
            Criar Conta Gratuita
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-gray-400">
            <p>&copy; 2024 Malu Vendas. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
