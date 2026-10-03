'use client';

import { useState, useEffect } from 'react';
import { criarCliente, deletarCliente, listarClientes, editarCliente } from './actions';

interface Cliente {
  id: string;
  nome: string;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNome, setEditNome] = useState('');
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);

  useEffect(() => {
    carregarClientes();
  }, []);

  async function carregarClientes() {
    const result = await listarClientes();
    if (result.success) {
      setClientes(result.data);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setLoading(true);
    setError('');

    const nome = (form.querySelector('input[name="nome"]') as HTMLInputElement)?.value;

    if (!nome || !nome.trim()) {
      setError('Nome é obrigatório');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('nome', nome);

    const result = await criarCliente(formData);

    if (result.success && result.data) {
      const novoCliente = result.data[0];
      setClientes([...clientes, novoCliente].sort((a, b) => a.nome.localeCompare(b.nome)));
      form.reset();
      setShowForm(false);
    } else {
      setError(result.error || 'Erro ao criar cliente');
    }
    setLoading(false);
  }

  async function handleDelete(clienteId: string) {
    if (!confirm('Tem certeza que deseja deletar este cliente?')) return;

    const result = await deletarCliente(clienteId);
    if (result.success) {
      setClientes(clientes.filter((c) => c.id !== clienteId));
    }
  }

  function startEdit(cliente: Cliente) {
    setEditingId(cliente.id);
    setEditNome(cliente.nome);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditNome('');
  }

  async function saveEdit(clienteId: string) {
    if (!editNome.trim()) return;

    const result = await editarCliente(clienteId, editNome);
    if (result.success) {
      setClientes(
        clientes
          .map((c) => (c.id === clienteId ? { ...c, nome: editNome.trim() } : c))
          .sort((a, b) => a.nome.localeCompare(b.nome))
      );
      cancelEdit();
    }
  }

  return (
    <div style={{ maxWidth: '960px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <div>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: '700',
            color: '#1e293b',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white',
              fontSize: '1.25rem'
            }}>
              👥
            </span>
            Clientes
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
            {clientes.length} {clientes.length === 1 ? 'registro' : 'registros'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          onMouseEnter={() => setHoveredBtn('novo')}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            background: hoveredBtn === 'novo'
              ? 'linear-gradient(135deg, #4f46e5, #7c3aed)'
              : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.75rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
            transition: 'all 0.2s ease'
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>+</span>
          Novo Cliente
        </button>
      </div>

      {/* Form Card */}
      {showForm && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '1rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          borderLeft: '4px solid #6366f1'
        }}>
          <h3 style={{
            margin: '0 0 1rem 0',
            fontSize: '1rem',
            fontWeight: '600',
            color: '#374151'
          }}>
            Cadastrar novo cliente
          </h3>
          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              marginBottom: '1rem',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span>⚠</span> {error}
            </div>
          )}
          <form onSubmit={handleSubmit} style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center'
          }}>
            <input
              type="text"
              name="nome"
              required
              autoFocus
              placeholder="Nome do cliente"
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                border: '2px solid #e2e8f0',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                outline: 'none',
                transition: 'border-color 0.2s',
                backgroundColor: '#f8fafc'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = '#6366f1'}
              onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
            />
            <button
              type="submit"
              disabled={loading}
              onMouseEnter={() => setHoveredBtn('salvar')}
              onMouseLeave={() => setHoveredBtn(null)}
              style={{
                backgroundColor: hoveredBtn === 'salvar' ? '#059669' : '#10b981',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              <span>✓</span> {loading ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(''); }}
              onMouseEnter={() => setHoveredBtn('cancelar')}
              onMouseLeave={() => setHoveredBtn(null)}
              style={{
                backgroundColor: hoveredBtn === 'cancelar' ? '#4b5563' : '#6b7280',
                color: 'white',
                border: 'none',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              <span>✕</span> Cancelar
            </button>
          </form>
        </div>
      )}

      {/* Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '1rem',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        overflow: 'hidden'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse'
        }}>
          <thead>
            <tr style={{
              background: 'linear-gradient(135deg, #f8fafc, #f1f5f9)',
              borderBottom: '2px solid #e2e8f0'
            }}>
              <th style={{
                padding: '1rem 1.5rem',
                textAlign: 'left',
                fontSize: '0.75rem',
                fontWeight: '700',
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Nome do Cliente
              </th>
              <th style={{
                padding: '1rem 1.5rem',
                textAlign: 'right',
                fontSize: '0.75rem',
                fontWeight: '700',
                color: '#475569',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                width: '200px'
              }}>
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {clientes && clientes.length > 0 ? (
              clientes.map((cliente, index) => (
                <tr
                  key={cliente.id}
                  onMouseEnter={() => setHoveredRow(cliente.id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  style={{
                    backgroundColor: hoveredRow === cliente.id ? '#f8fafc' : 'white',
                    borderBottom: index < clientes.length - 1 ? '1px solid #f1f5f9' : 'none',
                    transition: 'background-color 0.15s ease'
                  }}
                >
                  <td style={{ padding: '0.875rem 1.5rem' }}>
                    {editingId === cliente.id ? (
                      <input
                        type="text"
                        value={editNome}
                        onChange={(e) => setEditNome(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(cliente.id);
                          if (e.key === 'Escape') cancelEdit();
                        }}
                        style={{
                          width: '100%',
                          maxWidth: '400px',
                          padding: '0.5rem 0.75rem',
                          border: '2px solid #6366f1',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          outline: 'none',
                          backgroundColor: '#f8fafc'
                        }}
                      />
                    ) : (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem',
                          color: '#4f46e5',
                          fontWeight: '700',
                          flexShrink: 0
                        }}>
                          {cliente.nome.charAt(0).toUpperCase()}
                        </div>
                        <span style={{
                          fontSize: '0.875rem',
                          fontWeight: '500',
                          color: '#1e293b'
                        }}>
                          {cliente.nome}
                        </span>
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '0.875rem 1.5rem' }}>
                    <div style={{
                      display: 'flex',
                      gap: '0.5rem',
                      justifyContent: 'flex-end'
                    }}>
                      {editingId === cliente.id ? (
                        <>
                          <button
                            onClick={() => saveEdit(cliente.id)}
                            onMouseEnter={() => setHoveredBtn(`save-${cliente.id}`)}
                            onMouseLeave={() => setHoveredBtn(null)}
                            style={{
                              backgroundColor: hoveredBtn === `save-${cliente.id}` ? '#059669' : '#10b981',
                              color: 'white',
                              border: 'none',
                              padding: '0.375rem 0.875rem',
                              borderRadius: '0.375rem',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              transition: 'all 0.15s'
                            }}
                          >
                            ✓ Salvar
                          </button>
                          <button
                            onClick={cancelEdit}
                            onMouseEnter={() => setHoveredBtn(`cancel-${cliente.id}`)}
                            onMouseLeave={() => setHoveredBtn(null)}
                            style={{
                              backgroundColor: hoveredBtn === `cancel-${cliente.id}` ? '#e2e8f0' : '#f1f5f9',
                              color: '#475569',
                              border: 'none',
                              padding: '0.375rem 0.875rem',
                              borderRadius: '0.375rem',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              transition: 'all 0.15s'
                            }}
                          >
                            ✕ Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(cliente)}
                            onMouseEnter={() => setHoveredBtn(`edit-${cliente.id}`)}
                            onMouseLeave={() => setHoveredBtn(null)}
                            style={{
                              backgroundColor: hoveredBtn === `edit-${cliente.id}` ? '#e0e7ff' : 'transparent',
                              color: '#4f46e5',
                              border: '1px solid #e0e7ff',
                              padding: '0.375rem 0.75rem',
                              borderRadius: '0.375rem',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              transition: 'all 0.15s'
                            }}
                          >
                            ✏ Editar
                          </button>
                          <button
                            onClick={() => handleDelete(cliente.id)}
                            onMouseEnter={() => setHoveredBtn(`del-${cliente.id}`)}
                            onMouseLeave={() => setHoveredBtn(null)}
                            style={{
                              backgroundColor: hoveredBtn === `del-${cliente.id}` ? '#fee2e2' : 'transparent',
                              color: '#dc2626',
                              border: '1px solid #fecaca',
                              padding: '0.375rem 0.75rem',
                              borderRadius: '0.375rem',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              transition: 'all 0.15s'
                            }}
                          >
                            🗑 Deletar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} style={{
                  padding: '3rem 1.5rem',
                  textAlign: 'center'
                }}>
                  <div style={{ color: '#94a3b8' }}>
                    <div style={{
                      fontSize: '3rem',
                      marginBottom: '0.75rem',
                      opacity: 0.5
                    }}>
                      👥
                    </div>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#64748b',
                      margin: '0 0 0.25rem 0',
                      fontWeight: '500'
                    }}>
                      Nenhum cliente cadastrado
                    </p>
                    <p style={{
                      fontSize: '0.8rem',
                      color: '#94a3b8',
                      margin: 0
                    }}>
                      Clique em &quot;Novo Cliente&quot; para começar
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
