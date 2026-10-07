'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Package, ShoppingCart, ArrowLeftRight, Building2, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/usuarios', label: 'Usuários', icon: Users },
  { href: '/produtos', label: 'Produtos', icon: Package },
  { href: '/vendas', label: 'Vendas', icon: ShoppingCart },
  { href: '/movimentacoes', label: 'Movimentações', icon: ArrowLeftRight },
  { href: '/fornecedores', label: 'Fornecedores', icon: Building2 },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart2 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="relative flex h-screen w-64 flex-col bg-[#080c14] border-r border-white/5 overflow-hidden">

      {/* Grid de pontos */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
          backgroundSize: '32px 32px',
        }}
      />

      {/* Brilho ciano */}
      <div className="absolute -top-20 -left-20 h-48 w-48 rounded-full bg-cyan-500/10 blur-[60px] pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 h-48 w-48 rounded-full bg-cyan-500/5 blur-[60px] pointer-events-none" />

      {/* Logo */}
      <div className="relative z-10 flex h-16 items-center gap-3 border-b border-white/5 px-5">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-md" />
          <img
            src="/logo-nexo.png"
            alt="Nexo GL Digital"
            className="relative rounded-full object-cover"
            style={{ width: 34, height: 34 }}
          />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-white leading-tight">Nexo GL Digital</span>
          <span className="text-[10px] text-cyan-500/70 font-mono tracking-widest">SISTEMA</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex-1 space-y-0.5 p-3 pt-5">
        <p className="mb-3 px-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600">
          <span className="h-px w-3 bg-cyan-500/50" />
          Menu
        </p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                active
                  ? 'text-white'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5',
              )}
            >
              {/* Borda esquerda ativa */}
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-cyan-500" />
              )}

              {/* Fundo ativo */}
              {active && (
                <span className="absolute inset-0 rounded-lg bg-cyan-500/10" />
              )}

              <Icon className={cn('relative z-10 h-4 w-4 transition-colors', active ? 'text-cyan-400' : 'text-slate-600')} />
              <span className="relative z-10">{label}</span>

              {active && (
                <span className="relative z-10 ml-auto flex items-center gap-1">
                  <span className="h-px w-3 bg-cyan-500/50" />
                  <span className="h-1 w-1 rounded-full bg-cyan-500" />
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="relative z-10 border-t border-white/5 p-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-700 font-mono">v1.0.0</span>
          <div className="flex items-center gap-1">
            <span className="h-px w-3 bg-cyan-500/30" />
            <span className="h-1 w-1 rounded-full bg-cyan-500/50" />
          </div>
        </div>
      </div>
    </aside>
  );
}
