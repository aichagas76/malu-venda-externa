'use client';

import { useState, useEffect, useCallback } from 'react';

interface Produto {
  id: string;
  nome: string;
  sku: string;
  categoria: string;
  preco: number;
}

export default function ProdutosPage() {
  const [produtos, setProductos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarProdutos = useCallback(async () => {
    // Placeholder - será implementado com server actions
    setLoading(false);
  }, []);

  useEffect(() => { carregarProdutos(); }, [carregarProdutos]);

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Produtos</h1>
        <button
          style={{
            padding: '10px 20px',
            backgroundColor: '#0891b2',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px'
          }}>
          + Novo Produto
        </button>
      </div>

      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #e2e8f0',
        padding: '2rem',
        textAlign: 'center',
        color: '#94a3b8'
      }}>
        <p>Página de Produtos (em desenvolvimento)</p>
      </div>
    </div>
  );
}
