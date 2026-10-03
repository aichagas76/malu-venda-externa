'use client';

import { useState } from 'react';
import Link from 'next/link';
import { signup } from '@/app/auth/actions';

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    if (formData.get('password') !== formData.get('confirmPassword')) {
      setError('As senhas não coincidem');
      setLoading(false);
      return;
    }

    const result = await signup(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-wrap">
        <div className="auth-brand">
          <img src="/images/logo-malu.jpg" alt="Malu Folhados" className="auth-logo" />
          <span className="auth-brand-text">Vendas Externa</span>
        </div>
      <div className="auth-card">
        <h1 className="auth-title">
          Criar Conta
        </h1>
        <p className="auth-sub">Preencha os dados para começar a usar o sistema</p>

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div>
            <label htmlFor="nome" className="auth-label">
              Nome
            </label>
            <input
              id="nome"
              name="nome"
              type="text"
              placeholder="Seu Nome"
              required
              className="auth-input"
            />
          </div>

          <div>
            <label htmlFor="email" className="auth-label">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="seu@email.com"
              required
              className="auth-input"
            />
          </div>

          <div>
            <label htmlFor="password" className="auth-label">
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              className="auth-input"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="auth-label">
              Confirmar Senha
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              required
              className="auth-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="auth-btn"
          >
            {loading ? 'Cadastrando...' : 'Cadastrar'}
          </button>
        </form>

        <p className="auth-foot">
          Já tem conta?{' '}
          <Link href="/login" className="auth-link">
            Faça login
          </Link>
        </p>
      </div>
      </div>
    </div>
  );
}
