import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';

function Logo() {
  const navigate = useNavigate();
  return (
    <a
      href="/"
      onClick={(e) => { e.preventDefault(); navigate('/'); }}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
    >
      <span style={{
        display: 'inline-flex', width: 22, height: 22, borderRadius: 5,
        background: 'var(--ink)', color: 'var(--bg)',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Source Serif 4', serif", fontWeight: 700, fontSize: 13, lineHeight: '1',
      }}>m</span>
      <span style={{
        fontFamily: "'Source Serif 4', 'Noto Serif JP', serif",
        fontWeight: 600, fontSize: 17, letterSpacing: '-0.01em',
        color: 'var(--ink)',
      }}>mspec</span>
    </a>
  );
}

interface AppBarProps {
  breadcrumb?: ReactNode;
  right?: ReactNode;
}

export function AppBar({ breadcrumb, right }: AppBarProps) {
  return (
    <header style={{
      display: 'grid', gridTemplateColumns: '1fr auto',
      alignItems: 'center', gap: 16,
      padding: '14px 28px',
      borderBottom: '1px solid var(--rule)',
      background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 20,
      backdropFilter: 'saturate(140%) blur(8px)',
      WebkitBackdropFilter: 'saturate(140%) blur(8px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
        <Logo />
        {breadcrumb}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {right}
      </div>
    </header>
  );
}
