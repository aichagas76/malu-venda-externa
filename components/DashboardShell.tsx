'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, Moon, Sun, User } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [menuAberto, setMenuAberto] = useState(false);
  const pathname = usePathname();
  const [tema, setTema] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    setTema(document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
  }, []);

  const alternarTema = () => {
    const novo = tema === 'dark' ? 'light' : 'dark';
    setTema(novo);
    if (novo === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
    try { localStorage.setItem('tema', novo); } catch {}
  };

  useEffect(() => { setMenuAberto(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuAberto ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuAberto]);

  return (
    <div className="app-shell" style={{ display: 'flex', height: '100dvh', width: '100%' }}>
      <Sidebar aberta={menuAberto} onFechar={() => setMenuAberto(false)} />
      {menuAberto && <div className="app-overlay" onClick={() => setMenuAberto(false)} />}

      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <nav className="app-topbar" style={{
          backgroundColor: 'var(--superficie)',
          boxShadow: 'var(--sombra-sutil)',
          padding: '1.25rem 2rem',
          borderBottom: '1px solid var(--borda)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            <button
              type="button"
              className="app-hamburger"
              onClick={() => setMenuAberto(true)}
              aria-label="Abrir menu"
              title="Menu"
              style={{ width: '40px', height: '40px', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--borda)', borderRadius: 'var(--raio-sm)', backgroundColor: 'var(--superficie)', color: 'var(--texto)', cursor: 'pointer', flexShrink: 0 }}>
              <Menu size={22} strokeWidth={1.75} aria-hidden="true" />
            </button>
            <div className="app-title" style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--texto)', letterSpacing: '-0.01em' }}>
              Malu • Sistema de Vendas
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexShrink: 0 }}>
            <button
              type="button"
              onClick={alternarTema}
              aria-label={tema === 'dark' ? 'Mudar para tela clara' : 'Mudar para tela escura'}
              title={tema === 'dark' ? 'Tela clara' : 'Tela escura'}
              style={{ width: '36px', height: '36px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--borda)', borderRadius: 'var(--raio-sm)', backgroundColor: 'var(--superficie)', color: 'var(--texto-suave)', cursor: 'pointer', flexShrink: 0 }}>
              {tema === 'dark' ? <Sun size={18} strokeWidth={1.75} aria-hidden="true" /> : <Moon size={18} strokeWidth={1.75} aria-hidden="true" />}
            </button>
            <span className="app-user" style={{ fontSize: 'var(--fs-corpo)', color: 'var(--texto-suave)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}><User size={16} strokeWidth={1.75} aria-hidden="true" /> Vendedor</span>
            <a href="/login" style={{
              color: 'var(--texto-suave)',
              textDecoration: 'none',
              fontSize: 'var(--fs-corpo)',
              fontWeight: '500',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--raio-sm)',
              transition: 'all 0.2s',
              border: '1px solid var(--borda)'
            }}>
              Sair
            </a>
          </div>
        </nav>
        <main className="app-main" style={{
          flex: 1,
          overflowY: 'auto',
          padding: '2rem',
          backgroundColor: 'var(--fundo)'
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}
