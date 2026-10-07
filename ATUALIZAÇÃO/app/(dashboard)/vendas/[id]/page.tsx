'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Printer, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVenda } from '@/hooks/use-venda';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

const BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api/v1';
const FORMA_LABELS: Record<string, string> = { DINHEIRO: 'Dinheiro', PIX: 'PIX', CARTAO: 'Cartão' };

function getMeuPerfil(): string {
  try {
    const token = document.cookie.split('; ').find(r => r.startsWith('accessToken='))?.split('=')[1];
    if (!token) return 'OPERADOR';
    const payload = JSON.parse(atob(token.split('.')[1]!)) as { perfil: string };
    return payload.perfil;
  } catch { return 'OPERADOR'; }
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function VendaDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { venda, isLoading, mutate } = useVenda(id);
  const [perfil, setPerfil] = useState('OPERADOR');
  const [cancelando, setCancelando] = useState(false);

  useEffect(() => { setPerfil(getMeuPerfil()); }, []);

  const isAdmin = perfil === 'MASTER' || perfil === 'ADMIN';

  async function handleCancelar() {
    if (!venda) return;
    if (!confirm(`Cancelar a venda ${venda.numero}? O estoque será devolvido.`)) return;
    setCancelando(true);
    try {
      await apiClient.patch(`/vendas/${venda.id}/cancelar`, {});
      toast.success('Venda cancelada com sucesso');
      mutate();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao cancelar venda');
    } finally {
      setCancelando(false);
    }
  }

  if (isLoading) return <div className="text-slate-500 text-sm p-8">Carregando...</div>;
  if (!venda) return <div className="text-slate-500 text-sm p-8">Venda não encontrada.</div>;

  const cancelada = !!venda.canceladoEm;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/vendas')} className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white font-mono">{venda.numero}</h1>
              {cancelada && (
                <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-semibold text-red-400">
                  CANCELADA
                </span>
              )}
            </div>
            <p className="text-sm text-slate-400">
              {new Date(venda.criadoEm).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })}
            </p>
            {cancelada && (
              <p className="text-xs text-red-400 mt-0.5">
                Cancelada em {new Date(venda.canceladoEm!).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                {venda.canceladoPorNome ? ` por ${venda.canceladoPorNome}` : ''}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && !cancelada && (
            <Button
              onClick={handleCancelar}
              disabled={cancelando}
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/50"
            >
              <XCircle className="h-4 w-4" />
              {cancelando ? 'Cancelando...' : 'Cancelar venda'}
            </Button>
          )}
          <Button
            onClick={() => window.open(`${BASE_URL}/vendas/${venda.id}/recibo`, '_blank')}
            variant="outline"
            className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5"
          >
            <Printer className="h-4 w-4" />
            Imprimir recibo
          </Button>
        </div>
      </div>

      {/* Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="relative rounded-xl border border-white/5 bg-white/[0.03] p-4 space-y-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cliente</h3>
          <div className="space-y-1 text-sm">
            <p className="text-white">{venda.clienteNome ?? <span className="text-slate-600">Não informado</span>}</p>
            {venda.clienteTelefone && <p className="text-slate-400">{venda.clienteTelefone}</p>}
            {venda.clienteCpf && <p className="text-slate-400">CPF: {venda.clienteCpf}</p>}
          </div>
        </div>
        <div className="relative rounded-xl border border-white/5 bg-white/[0.03] p-4 space-y-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pagamento</h3>
          <div className="space-y-1 text-sm">
            <p className="text-white">{FORMA_LABELS[venda.formaPagamento] ?? venda.formaPagamento}</p>
            <p className="text-slate-400">Operador: {venda.usuarioNome}</p>
            {venda.observacao && <p className="text-slate-400 italic">{venda.observacao}</p>}
          </div>
        </div>
      </div>

      {/* Itens */}
      <div className="relative rounded-xl border border-white/5 bg-white/[0.03] overflow-hidden backdrop-blur-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-left text-xs text-slate-500 uppercase tracking-wider">
              <th className="px-4 py-3">Produto</th>
              <th className="px-4 py-3 text-center">Qtd</th>
              <th className="px-4 py-3 text-right">Preço unit.</th>
              <th className="px-4 py-3 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {venda.itens.map((item) => (
              <tr key={item.id} className="border-b border-white/5">
                <td className="px-4 py-3">
                  <div className="text-white">{item.produtoNome}</div>
                  <div className="text-xs text-slate-500">{item.produtoSku}</div>
                </td>
                <td className="px-4 py-3 text-center text-slate-300">{item.quantidade}</td>
                <td className="px-4 py-3 text-right text-slate-300">{fmt(item.precoUnitario)}</td>
                <td className="px-4 py-3 text-right font-medium text-white">{fmt(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totais */}
      <div className="relative rounded-xl border border-white/5 bg-white/[0.03] p-4 space-y-2 max-w-xs ml-auto">
        <div className="flex justify-between text-sm text-slate-400">
          <span>Subtotal</span>
          <span>{fmt(venda.subtotal)}</span>
        </div>
        {venda.descontoAplicado > 0 && (
          <div className="flex justify-between text-sm text-green-400">
            <span>Desconto PIX ({venda.descontoPercentual}%)</span>
            <span>- {fmt(venda.descontoAplicado)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold text-white border-t border-white/10 pt-2">
          <span>Total</span>
          <span>{fmt(venda.total)}</span>
        </div>
      </div>
    </div>
  );
}
