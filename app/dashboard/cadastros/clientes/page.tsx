'use client';

import { useState, useEffect, useCallback } from 'react';
import { listarClientes, criarCliente, atualizarCliente, deletarCliente } from './actions';

interface Cliente {
  id: string;
  nome: string;
  telefone?: string;
  data_cadastro?: string;
}

interface FormData {
  nome: string;
  telefone: string;
}

const FORM_INICIAL: FormData = { nome: '', telefone: '' };

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState<FormData>(FORM_INICIAL);
  const [enviando, setEnviando] = useState(false);

  const carregarClientes = useCallback(async () => {
    const result = await listarClientes();
    if (result.success) setClientes(result.data as Cliente[]);
    setLoading(false);
  }, []);

  useEffect(() => { carregarClientes(); }, [carregarClientes]);

  const abrirNovoCliente = () => {
    setEditando(null);
    setFormData(FORM_INICIAL);
    setShowModal(true);
  };

  const abrirEdicao = (cliente: Cliente) => {
    setEditando(cliente);
    setFormData({
      nome: cliente.nome,
      telefone: cliente.telefone || '',
    });
    setShowModal(true);
  };

  const handleSalvar = async () => {
    setEnviando(true);
    const result = editando
      ? await atualizarCliente(editando.id, formData.nome, formData.telefone)
      : await criarCliente(formData.nome, formData.telefone);

    if (result.success) {
      await carregarClientes();
      setShowModal(false);
    }
    setEnviando(false);
  };

  const handleDeletar = async (clienteId: string) => {
    if (!confirm('Tem certeza que quer deletar este cliente?')) return;
    const result = await deletarCliente(clienteId);
    if (result.success) await carregarClientes();
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>Carregando...</div>;
  }

  return (
    <div style={{ padding: '2rem' }}>
      {/* Cabeçalho */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: 0 }}>Clientes</h1>
        <button
          onClick={abrirNovoCliente}
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
          + Novo Cliente
        </button>
      </div>

      {/* Tabela */}
      <div style={{ backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Nome</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Telefone</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Data de Cadastro</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {clientes.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
                  Nenhum cliente cadastrado
                </td>
              </tr>
            ) : (
              clientes.map((cliente) => (
                <tr key={cliente.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1e293b' }}>{cliente.nome}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>{cliente.telefone || '—'}</td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#64748b' }}>
                    {cliente.data_cadastro ? new Date(cliente.data_cadastro).toLocaleDateString('pt-BR') : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'center', display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      onClick={() => abrirEdicao(cliente)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#f1f5f9',
                        color: '#0891b2',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeletar(cliente.id)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600'
                      }}>
                      Deletar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div onClick={() => setShowModal(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', maxWidth: '500px', width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>

            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 20px' }}>
              {editando ? 'Editar Cliente' : 'Novo Cliente'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Nome *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={e => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Nome do cliente"
                  style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Telefone</label>
                <input
                  type="tel"
                  value={formData.telefone}
                  onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                  placeholder="(00) 00000-0000"
                  style={{ width: '100%', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: 'white',
                  color: '#374151',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px'
                }}>
                Cancelar
              </button>
              <button
                onClick={handleSalvar}
                disabled={enviando}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#0891b2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: enviando ? 'not-allowed' : 'pointer',
                  fontWeight: '600',
                  fontSize: '14px',
                  opacity: enviando ? 0.6 : 1
                }}>
                {enviando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
