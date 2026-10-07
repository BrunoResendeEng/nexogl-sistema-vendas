'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVendaList } from '@/hooks/use-venda';

const FORMA_LABELS: Record<string, string> = { DINHEIRO: 'Dinheiro', PIX: 'PIX', CARTAO: 'Cartão' };
const FORMA_COLORS: Record<string, string> = {
  DINHEIRO: 'bg-green-500/10 text-green-400',
  PIX: 'bg-blue-500/10 text-blue-400',
  CARTAO: 'bg-purple-500/10 text-purple-400',
};

const PAGE_SIZE = 20;

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function VendasPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const { vendas, meta, isLoading } = useVendaList({ page, pageSize: PAGE_SIZE });
  const totalPages = meta ? Math.ceil(meta.total / PAGE_SIZE) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-px w-4 bg-cyan-500/50" />
            <span className="h-1 w-1 rounded-full bg-cyan-500" />
            <h1 className="text-2xl font-bold text-white">Vendas</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {meta ? `${meta.total} venda${meta.total !== 1 ? 's' : ''} registrada${meta.total !== 1 ? 's' : ''}` : ''}
          </p>
        </div>
        <Button onClick={() => router.push('/vendas/nova')} className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30">
          <Plus className="h-4 w-4" />
          Nova venda
        </Button>
      </div>

      <div className="relative rounded-xl border border-white/5 bg-white/[0.03] overflow-hidden backdrop-blur-sm">
        <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Carregando...</div>
        ) : vendas.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-sm">Nenhuma venda registrada</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3">Número</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Pagamento</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Operador</th>
              </tr>
            </thead>
            <tbody>
              {vendas.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => router.push(`/vendas/${v.id}`)}
                  className={`border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors ${v.canceladoEm ? 'opacity-50' : ''}`}
                >
                  <td className="px-4 py-3 font-mono">
                    <div className="flex items-center gap-2">
                      <span className={v.canceladoEm ? 'text-slate-500 line-through' : 'text-cyan-400'}>{v.numero}</span>
                      {v.canceladoEm && (
                        <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400">CANCELADA</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {new Date(v.criadoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{v.clienteNome ?? <span className="text-slate-600">—</span>}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${FORMA_COLORS[v.formaPagamento] ?? ''}`}>
                      {FORMA_LABELS[v.formaPagamento] ?? v.formaPagamento}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-white">{fmt(v.total)}</td>
                  <td className="px-4 py-3 text-slate-400">{v.usuarioNome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {meta && meta.total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="rounded-lg p-2 hover:bg-white/5 disabled:opacity-40">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="rounded-lg p-2 hover:bg-white/5 disabled:opacity-40">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
