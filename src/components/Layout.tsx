import { NavLink, Outlet } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { supabase } from '@/lib/supabase';

const NAV = [
  { to: '/', label: 'Lançamentos' },
  { to: '/inventario', label: 'Estoque' },
  { to: '/dashboard', label: 'Relatório mensal' },
  { to: '/config', label: 'Cadastros' },
];

export function Layout() {
  const today = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());

  return (
    <div className="min-h-screen">
      <header className="bg-header text-white">
        <div className="mx-auto max-w-6xl px-6 flex items-center justify-between h-12">
          <div className="flex items-baseline gap-2.5">
            <span className="text-[15px] font-semibold tracking-tight">Tibia Profit Tracker</span>
            <span className="text-[11px] uppercase tracking-wider text-white/50">
              controle financeiro
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/60 capitalize tabnum">{today}</span>
            <button
              type="button"
              onClick={() => supabase.auth.signOut()}
              className="text-xs text-white/60 hover:text-white"
            >
              Sair
            </button>
          </div>
        </div>
      </header>
      <nav className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 flex items-end gap-1">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === '/'}
              className={({ isActive }) =>
                cn('tab flex items-center h-10', isActive && 'tab-active')
              }
            >
              {n.label}
            </NavLink>
          ))}
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-6 py-5">
        <Outlet />
      </main>
    </div>
  );
}
