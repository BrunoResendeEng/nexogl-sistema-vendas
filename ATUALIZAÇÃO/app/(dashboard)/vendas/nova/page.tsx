'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/use-debounce';
import useSWR from 'swr';
import { ScannerInput } from '@/components/scanner/scanner-input';

const BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api/v1';

type ProdutoBusca = {
  id: string; sku: string; nome: string; categoria: string;
  estoqueAtual: number; precoVenda: number | null; codigosBarras?: string[];
};

type ItemCarrinho = ProdutoBusca & { quantidade: number };

async function fetchProdutos(url: string) {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) return { data: [] };
  return res.json();
}

const FIELD = 'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500';

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function NovaVendaPage() {
  const router = useRouter();
  const [busca, setBusca] = useState('');
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [formaPagamento, setFormaPagamento] = useState<'DINHEIRO' | 'PIX' | 'CARTAO'>('DINHEIRO');
  const [aplicarDesconto, setAplicarDesconto] = useState(true);
  const [clienteNome, setClienteNome] = useState('');
  const [clienteTelefone, setClienteTelefone] = useState('');
  const [clienteCpf, setClienteCpf] = useState('');
  const [observacao, setObservacao] = useState('');
  const [salvando, setSalvando] = useState(false);

  const debouncedBusca = useDebounce(busca, 300);
  const { data: resultados } = useSWR<{ data: ProdutoBusca[] }>(
    debouncedBusca.length >= 2
      ? `${BASE_URL}/produtos?search=${encodeURIComponent(debouncedBusca)}&ativo=true&pageSize=8`
      : null,
    fetchProdutos,
  );

  const addItem = useCallback((p: ProdutoBusca) => {
    setCarrinho((prev) => {
      const existe = prev.find((i) => i.id === p.id);
      if (existe) return prev.map((i) => i.id === p.id ? { ...i, quantidade: i.quantidade + 1 } : i);
      return [...prev, { ...p, quantidade: 1 }];
    });
    setBusca('');
  }, []);

  async function handleScan(codigo: string) {
    try {
      const res = await fetch(
        `${BASE_URL}/produtos?search=${encodeURIComponent(codigo)}&ativo=true&pageSize=10`,
        { credentials: 'include' },
      );
      const json = await res.json() as { data: ProdutoBusca[] };
      const encontrado = json.data.find(
        (p) => p.sku === codigo || p.codigosBarras?.includes(codigo),
      );
      if (encontrado) {
        if (encontrado.estoqueAtual <= 0) {
          toast.error(`${encontrado.nome} sem estoque`);
          return;
        }
        addItem(encontrado);
        toast.success(`${encontrado.nome} adicionado`);
      } else {
        toast.error('Produto não encontrado para este código');
      }
    } catch {
      toast.error('Erro ao buscar produto');
    }
  }

  const removeItem = (id: string) => setCarrinho((prev) => prev.filter((i) => i.id !== id));
  const setQtd = (id: string, qtd: number) => {
    if (qtd < 1) return;
    setCarrinho((prev) => prev.map((i) => i.id === id ? { ...i, quantidade: qtd } : i));
  };

  const subtotal = carrinho.reduce((s, i) => s + (i.precoVenda ?? 0) * i.quantidade, 0);
  const desconto = formaPagamento === 'PIX' && aplicarDesconto ? Number((subtotal * 0.05).toFixed(2)) : 0;
  const total = subtotal - desconto;

  async function handleConfirmar() {
    if (carrinho.length === 0) return;
    setSalvando(true);
    try {
      const venda = await apiClient.post<{ id: string }>('/vendas', {
        clienteNome: clienteNome || undefined,
        clienteTelefone: clienteTelefone || undefined,
        clienteCpf: clienteCpf || undefined,
        formaPagamento,
        aplicarDescontoPix: aplicarDesconto,
        observacao: observacao || undefined,
        itens: carrinho.map((i) => ({ produtoId: i.id, quantidade: i.quantidade })),
      });
      toast.success('Venda registrada!');
      router.push(`/vendas/${venda.id}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao registrar venda');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex gap-6 h-full">
      {/* Coluna esquerda — busca + carrinho */}
      <div className="flex-1 space-y-4">
        <div className="flex items-center gap-2">
          <span className="h-px w-4 bg-cyan-500/50" />
          <span className="h-1 w-1 rounded-full bg-cyan-500" />
          <h1 className="text-2xl font-bold text-white">Nova Venda</h1>
        </div>

        {/* Busca + Scanner */}
        <div className="space-y-2">
          <ScannerInput
            onScan={handleScan}
            onChange={(v) => setBusca(v)}
            placeholder="Buscar por nome, SKU ou escanear código de barras..."
            autoFocus
          />
          {resultados && resultados.data.length > 0 && busca.length >= 2 && (
            <div className="relative">
              <div className="absolute z-10 w-full rounded-xl border border-white/10 bg-slate-800 shadow-xl overflow-hidden">
                {resultados.data.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { addItem(p); setBusca(''); }}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 text-left transition-colors"
                  >
                    <div>
                      <span className="text-white text-sm">{p.nome}</span>
                      <span className="ml-2 text-xs text-slate-500">{p.sku}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-orange-400">{p.precoVenda ? fmt(p.precoVenda) : '—'}</div>
                      <div className="text-xs text-slate-500">Estoque: {p.estoqueAtual}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Carrinho */}
        <div className="relative rounded-xl border border-white/5 bg-white/[0.03] overflow-hidden backdrop-blur-sm">
          {carrinho.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-600">
              <ShoppingCart className="h-10 w-10 mb-3" />
              <p className="text-sm">Carrinho vazio — busque um produto acima</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3 text-center">Qtd</th>
                  <th className="px-4 py-3 text-right">Preço unit.</th>
                  <th className="px-4 py-3 text-right">Subtotal</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {carrinho.map((item) => (
                  <tr key={item.id} className="border-b border-white/5">
                    <td className="px-4 py-3">
                      <div className="text-white">{item.nome}</div>
                      <div className="text-xs text-slate-500">{item.sku}</div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={1}
                        max={item.estoqueAtual}
                        value={item.quantidade}
                        onChange={(e) => setQtd(item.id, Number(e.target.value))}
                        className="w-16 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-center text-sm text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      />
                      <div className={`text-xs mt-1 text-center ${
                        item.estoqueAtual - item.quantidade <= 0 ? 'text-red-400' :
                        item.estoqueAtual - item.quantidade <= 3 ? 'text-amber-400' : 'text-slate-500'
                      }`}>
                        {item.estoqueAtual - item.quantidade <= 0
                          ? 'sem estoque'
                          : `${item.estoqueAtual - item.quantidade} restam`}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">{item.precoVenda ? fmt(item.precoVenda) : '—'}</td>
                    <td className="px-4 py-3 text-right font-medium text-white">{fmt((item.precoVenda ?? 0) * item.quantidade)}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => removeItem(item.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Coluna direita — painel */}
      <div className="w-80 space-y-4">
        {/* Cliente */}
        <div className="relative rounded-xl border border-white/5 bg-white/[0.03] p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-300">Cliente (opcional)</h3>
          <div className="space-y-2">
            <input value={clienteNome} onChange={(e) => setClienteNome(e.target.value)} placeholder="Nome" className={FIELD} />
            <input value={clienteTelefone} onChange={(e) => setClienteTelefone(e.target.value)} placeholder="Telefone" className={FIELD} />
            <input value={clienteCpf} onChange={(e) => setClienteCpf(e.target.value)} placeholder="CPF (opcional)" className={FIELD} />
          </div>
        </div>

        {/* Pagamento */}
        <div className="relative rounded-xl border border-white/5 bg-white/[0.03] p-4 space-y-3">
          <h3 className="text-sm font-semibold text-slate-300">Forma de pagamento</h3>
          <div className="grid grid-cols-3 gap-2">
            {(['DINHEIRO', 'PIX', 'CARTAO'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFormaPagamento(f)}
                className={`rounded-lg py-2 text-xs font-medium transition-colors ${
                  formaPagamento === f
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-white/5 text-slate-500 hover:text-slate-300 border border-white/5'
                }`}
              >
                {f === 'DINHEIRO' ? 'Dinheiro' : f === 'PIX' ? 'PIX' : 'Cartão'}
              </button>
            ))}
          </div>

          {formaPagamento === 'PIX' && (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={aplicarDesconto}
                onChange={(e) => setAplicarDesconto(e.target.checked)}
                className="rounded border-white/20 bg-slate-800 text-orange-500"
              />
              <span className="text-xs text-slate-300">Aplicar desconto PIX (5%)</span>
            </label>
          )}
        </div>

        {/* Observação */}
        <div className="relative rounded-xl border border-white/5 bg-white/[0.03] p-4 space-y-2">
          <Label className="text-sm text-slate-300">Observação</Label>
          <textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            rows={2}
            placeholder="Opcional..."
            className={FIELD + ' resize-none'}
          />
        </div>

        {/* Resumo */}
        <div className="relative rounded-xl border border-white/5 bg-white/[0.03] p-4 space-y-2">
          <div className="flex justify-between text-sm text-slate-400">
            <span>Subtotal</span>
            <span>{fmt(subtotal)}</span>
          </div>
          {desconto > 0 && (
            <div className="flex justify-between text-sm text-green-400">
              <span>Desconto PIX (5%)</span>
              <span>- {fmt(desconto)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-white border-t border-white/10 pt-2 mt-2">
            <span>Total</span>
            <span>{fmt(total)}</span>
          </div>
        </div>

        <Button
          onClick={handleConfirmar}
          disabled={carrinho.length === 0 || salvando}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50"
        >
          {salvando ? 'Registrando...' : 'Confirmar venda'}
        </Button>
      </div>
    </div>
  );
}
