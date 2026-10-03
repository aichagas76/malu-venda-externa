'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
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
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          padding: '1.25rem 2rem',
          borderBottom: '1px solid #e2e8f0',
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
              style={{ width: '40px', height: '40px', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: 'white', color: '#1e293b', cursor: 'pointer', flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
            </button>
            <div className="app-title" style={{ fontSize: '1.25rem', fontWeight: '700', color: '#1e293b', letterSpacing: '-0.5px' }}>
              Malu • Sistema de Vendas
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexShrink: 0 }}>
            <button
              type="button"
              onClick={alternarTema}
              aria-label={tema === 'dark' ? 'Mudar para tela clara' : 'Mudar para tela escura'}
              title={tema === 'dark' ? 'Tela clara' : 'Tela escura'}
              style={{ width: '36px', height: '36px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0', borderRadius: '8px', backgroundColor: 'white', color: '#475569', cursor: 'pointer', flexShrink: 0 }}>
              {tema === 'dark' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
              )}
            </button>
            <span className="app-user" style={{ fontSize: '0.875rem', color: '#64748b' }}>👤 Vendedor</span>
            <a href="/login" style={{
              color: '#64748b',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: '500',
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              transition: 'all 0.2s',
              border: '1px solid #e2e8f0'
            }}>
              Sair
            </a>
          </div>
        </nav>
        <main className="app-main" style={{
          flex: 1,
          overflowY: 'auto',
          padding: '2rem',
          backgroundColor: '#f8fafc'
        }}>
          {children}
        </main>
      </div>
    </div>
  );
}
