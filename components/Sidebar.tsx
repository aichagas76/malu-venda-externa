'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { useState } from 'react';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/dashboard/pedidos', label: 'Pedidos', icon: '🛒' },
  { href: '/dashboard/fabricacao', label: 'Etapas da Produção', icon: '⚙️' },
  {
    label: 'Cadastros',
    icon: '📋',
    submenu: [
      { href: '/dashboard/cadastros/clientes', label: 'Clientes' },
      { href: '/dashboard/cadastros/categorias', label: 'Categorias' },
      { href: '/dashboard/cadastros/produtos', label: 'Produtos' },
    ]
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  return (
    <aside style={{
      width: '280px',
      backgroundColor: '#0f172a',
      color: 'white',
      boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      overflowY: 'auto'
    }}>
      {/* Logo Section */}
      <div style={{
        padding: '2rem 1.5rem',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        textAlign: 'center'
      }}>
        <div style={{ position: 'relative', width: '100%', height: '60px', marginBottom: '1rem' }}>
          <Image
            src="/images/logo-malu.jpg"
            alt="Malu Folhados"
            fill
            style={{ objectFit: 'contain' }}
          />
        </div>
        <p style={{
          fontSize: '0.875rem',
          color: '#cbd5e1',
          fontWeight: '500',
          letterSpacing: '0.05em',
          marginTop: '0.5rem'
        }}>
          VENDAS EXTERNA
        </p>
      </div>

      {/* Navigation */}
      <nav style={{
        padding: '2rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        flex: 1
      }}>
        {menuItems.map((item: any) => {
          const isActive = 'href' in item && pathname === item.href;
          const hasSubmenu = 'submenu' in item;
          const isSubmenuActive = hasSubmenu && item.submenu.some((sub: any) => pathname === sub.href);
          const isExpanded = expandedMenu === item.label;

          if (hasSubmenu) {
            return (
              <div key={item.label}>
                <button
                  onClick={() => setExpandedMenu(isExpanded ? null : item.label)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.875rem 1.25rem',
                    borderRadius: '0.75rem',
                    border: 'none',
                    backgroundColor: isSubmenuActive ? 'rgba(251, 191, 36, 0.1)' : 'transparent',
                    color: isSubmenuActive ? '#fbbf24' : '#94a3b8',
                    fontSize: '0.95rem',
                    fontWeight: isSubmenuActive ? '600' : '500',
                    cursor: 'pointer',
                    width: '100%',
                    textAlign: 'left',
                    transition: 'all 0.2s ease'
                  }}>
                  <span style={{ fontSize: '1.25rem', width: '24px', textAlign: 'center' }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <span style={{ fontSize: '0.75rem', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>▼</span>
                </button>

                {isExpanded && (
                  <div style={{ paddingLeft: '1rem' }}>
                    {item.submenu.map((sub: any) => {
                      const isSubActive = pathname === sub.href;
                      return (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem',
                            padding: '0.625rem 1.25rem',
                            borderRadius: '0.5rem',
                            textDecoration: 'none',
                            color: isSubActive ? '#fbbf24' : '#94a3b8',
                            backgroundColor: isSubActive ? 'rgba(251, 191, 36, 0.1)' : 'transparent',
                            borderLeft: isSubActive ? '4px solid #fbbf24' : '4px solid transparent',
                            paddingLeft: isSubActive ? 'calc(1.25rem - 4px)' : '1.25rem',
                            fontSize: '0.875rem',
                            fontWeight: isSubActive ? '600' : '500',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <span style={{ fontSize: '0.75rem', width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'currentColor' }}></span>
                          {sub.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.875rem 1.25rem',
                borderRadius: '0.75rem',
                transition: 'all 0.3s ease',
                textDecoration: 'none',
                color: isActive ? '#fbbf24' : '#94a3b8',
                backgroundColor: isActive ? 'rgba(251, 191, 36, 0.1)' : 'transparent',
                borderLeft: isActive ? '4px solid #fbbf24' : '4px solid transparent',
                paddingLeft: isActive ? 'calc(1.25rem - 4px)' : '1.25rem',
                fontWeight: isActive ? '600' : '500',
                fontSize: '0.95rem'
              }}
            >
              <span style={{ fontSize: '1.25rem', width: '24px', textAlign: 'center' }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '1.5rem',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        fontSize: '0.75rem',
        color: '#64748b',
        textAlign: 'center'
      }}>
        <p style={{ margin: '0' }}>v 2.0 • Malu Folhados</p>
      </div>
    </aside>
  );
}
