'use client';

import { useState } from 'react';
import Link from 'next/link';
import { login } from '@/app/auth/actions';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await login(formData);

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
          Malu Vendas
        </h1>
        <p className="auth-sub">Entre para acessar o sistema de vendas</p>

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
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

          <button
            type="submit"
            disabled={loading}
            className="auth-btn"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="auth-foot">
          Não tem conta?{' '}
          <Link href="/signup" className="auth-link">
            Cadastre-se
          </Link>
        </p>
      </div>
      </div>
    </div>
  );
}
