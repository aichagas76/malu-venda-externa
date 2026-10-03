'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [menuAberto, setMenuAberto] = useState(false);
  const pathname = usePathname();

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
