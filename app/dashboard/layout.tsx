import Sidebar from '@/components/Sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%' }}>
      <Sidebar />
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
        <nav style={{
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          padding: '1.25rem 2rem',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: '#1e293b',
            letterSpacing: '-0.5px'
          }}>
            Malu • Sistema de Vendas
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>👤 Vendedor</span>
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
        <main style={{
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
