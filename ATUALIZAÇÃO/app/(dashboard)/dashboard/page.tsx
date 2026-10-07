'use client';

import { useState } from 'react';
import { Users, Package, AlertTriangle, ShoppingCart, TrendingUp, XCircle } from 'lucide-react';
import useSWR from 'swr';
import { useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

const BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api/v1';

const FORMA_LABELS: Record<string, string> = { DINHEIRO: 'Dinheiro', PIX: 'PIX', CARTAO: 'Cartão' };
const FORMA_COLORS: Record<string, string> = {
  DINHEIRO: 'bg-green-500/10 text-green-400',
  PIX: 'bg-blue-500/10 text-blue-400',
  CARTAO: 'bg-purple-500/10 text-purple-400',
};
const CATEGORIA_LABEL: Record<string, string> = {
  MOT: 'Motor', FRE: 'Freio', TRA: 'Transmissão', ELE: 'Elétrica',
  SUS: 'Suspensão', PNE: 'Pneu', ACC: 'Acessórios', OUT: 'Outros',
};

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

type GraficoDia = { dia: string; label: string; total: number; quantidade: number };

type DashboardData = {
  cards: {
    totalProdutos: number;
    totalUsuarios: number;
    estoqueCritico: number;
    semEstoque: number;
    vendasHoje: number;
    vendasMes: number;
    totalVendasMes: number;
  };
  ultimasVendas: {
    id: string; numero: string; clienteNome: string | null;
    formaPagamento: string; total: number; usuarioNome: string; criadoEm: string;
  }[];
  produtosCriticos: {
    id: string; sku: string; nome: string;
    estoqueAtual: number; estoqueMinimo: number; categoria: string;
  }[];
  grafico7dias: GraficoDia[];
};

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Erro ao carregar');
  return res.json() as Promise<T>;
}

function TooltipCustom({ active, payload, label }: {
  active?: boolean; payload?: { value: number }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-slate-800 px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400 mb-1">{label}</p>
      <p className="text-white font-semibold">{fmt(payload[0]?.value ?? 0)}</p>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [dias, setDias] = useState(7);
  const { data, isLoading } = useSWR<DashboardData>(`${BASE_URL}/dashboard?dias=${dias}`, fetcher, {
    refreshInterval: 30000,
  });

  const c = data?.cards;

  const cards = [
    {
      label: 'Vendas hoje',
      value: isLoading ? '—' : String(c?.vendasHoje ?? 0),
      sub: isLoading ? '' : `${c?.vendasMes ?? 0} no mês`,
      icon: ShoppingCart,
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
    },
    {
      label: 'Faturamento do mês',
      value: isLoading ? '—' : fmt(c?.totalVendasMes ?? 0),
      sub: 'Vendas não canceladas',
      icon: TrendingUp,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Produtos ativos',
      value: isLoading ? '—' : String(c?.totalProdutos ?? 0),
      sub: isLoading ? '' : `${c?.semEstoque ?? 0} sem estoque`,
      icon: Package,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Estoque crítico',
      value: isLoading ? '—' : String(c?.estoqueCritico ?? 0),
      sub: 'Abaixo ou igual ao mínimo',
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-px w-4 bg-cyan-500/50" />
            <span className="h-1 w-1 rounded-full bg-cyan-500" />
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">Visão geral do sistema</p>
        </div>
        <div className="flex gap-2">
          {[7, 15, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDias(d)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                dias === d ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-slate-500 hover:text-slate-300 border border-white/5'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, sub, icon: Icon, color, bg }) => (
          <div key={label} className="relative rounded-xl border border-white/5 bg-white/[0.03] p-5 overflow-hidden backdrop-blur-sm">
            <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: '24px 24px' }} />
            <div className="relative z-10 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-400">{label}</p>
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
            </div>
            <p className="relative z-10 mt-3 text-3xl font-bold text-white">{value}</p>
            <p className="relative z-10 mt-1 text-xs text-slate-500">{sub}</p>
            <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
          </div>
        ))}
      </div>

      {/* Gráfico */}
      <div className="relative rounded-xl border border-white/5 bg-white/[0.03] p-5 overflow-hidden backdrop-blur-sm">
        <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
        <div className="flex items-center gap-2 mb-4">
          <span className="h-px w-4 bg-cyan-500/50" />
          <span className="h-1 w-1 rounded-full bg-cyan-500" />
          <h2 className="text-sm font-semibold text-slate-300">Faturamento — últimos {dias} dias</h2>
        </div>
        {isLoading ? (
          <div className="h-48 flex items-center justify-center text-slate-500 text-sm">Carregando...</div>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data?.grafico7dias ?? []} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => v === 0 ? '0' : `R$${(v / 1000).toFixed(0)}k`}
                width={48}
              />
              <Tooltip content={<TooltipCustom />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="total" fill="#06b6d4" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Últimas vendas */}
        <div className="relative rounded-xl border border-white/5 bg-white/[0.03] overflow-hidden backdrop-blur-sm">
          <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
          <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
            <span className="h-px w-4 bg-cyan-500/50" />
            <span className="h-1 w-1 rounded-full bg-cyan-500" />
            <h2 className="text-sm font-semibold text-slate-300">Últimas vendas</h2>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Carregando...</div>
          ) : !data?.ultimasVendas.length ? (
            <div className="p-8 text-center text-slate-500 text-sm">Nenhuma venda registrada</div>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-white/5">
                {data.ultimasVendas.map((v) => (
                  <tr
                    key={v.id}
                    onClick={() => router.push(`/vendas/${v.id}`)}
                    className="px-4 hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-cyan-400">{v.numero}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {new Date(v.criadoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${FORMA_COLORS[v.formaPagamento] ?? ''}`}>
                        {FORMA_LABELS[v.formaPagamento] ?? v.formaPagamento}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-white">{fmt(v.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Estoque crítico */}
        <div className="relative rounded-xl border border-white/5 bg-white/[0.03] overflow-hidden backdrop-blur-sm">
          <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
          <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
            <span className="h-px w-4 bg-cyan-500/50" />
            <span className="h-1 w-1 rounded-full bg-cyan-500" />
            <h2 className="text-sm font-semibold text-slate-300">Produtos com estoque crítico</h2>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Carregando...</div>
          ) : !data?.produtosCriticos.length ? (
            <div className="p-8 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
              <XCircle className="h-8 w-8 text-slate-700" />
              Nenhum produto em situação crítica
            </div>
          ) : (
            <table className="w-full text-sm">
              <tbody className="divide-y divide-white/5">
                {data.produtosCriticos.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => router.push('/produtos')}
                    className="hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="text-white text-sm">{p.nome}</div>
                      <div className="text-xs text-slate-500">{p.sku} · {CATEGORIA_LABEL[p.categoria] ?? p.categoria}</div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {p.estoqueAtual === 0 ? (
                        <span className="text-red-400 font-semibold text-sm">0 <span className="text-[10px]">SEM ESTOQUE</span></span>
                      ) : (
                        <span className="text-cyan-400 font-semibold text-sm">
                          {p.estoqueAtual} <span className="text-[10px]">/ mín {p.estoqueMinimo}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
