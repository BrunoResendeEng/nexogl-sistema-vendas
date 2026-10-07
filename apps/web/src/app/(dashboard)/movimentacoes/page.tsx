'use client';

import { useState, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import useSWR from 'swr';
import { useDebounce } from '@/hooks/use-debounce';

const BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api/v1';
const PAGE_SIZE = 20;

type MovimentacaoItem = {
  id: string; tipo: string; quantidade: number; custoUnitario: number;
  observacao: string | null; produtoId: string; produtoNome: string;
  produtoSku: string; usuarioNome: string; criadoEm: string;
};

type ProdutoBusca = { id: string; sku: string; nome: string; estoqueAtual: number; categoria: string; custoMedio: number };
type FornecedorBusca = { id: string; razaoSocial: string; cnpj: string };

const TIPO_LABELS: Record<string, string> = {
  ENTRADA: 'Entrada', SAIDA: 'Saída', AJUSTE: 'Ajuste', PERDA: 'Perda', DEVOLUCAO: 'Devolução',
};
const TIPO_COLORS: Record<string, string> = {
  ENTRADA: 'bg-green-500/10 text-green-400',
  SAIDA: 'bg-red-500/10 text-red-400',
  AJUSTE: 'bg-blue-500/10 text-blue-400',
  PERDA: 'bg-amber-500/10 text-amber-400',
  DEVOLUCAO: 'bg-purple-500/10 text-purple-400',
};

const FIELD = 'w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500';

function getMeuPerfil(): string {
  try {
    const token = document.cookie.split('; ').find(r => r.startsWith('accessToken='))?.split('=')[1];
    if (!token) return 'OPERADOR';
    const payload = JSON.parse(atob(token.split('.')[1]!)) as { perfil: string };
    return payload.perfil;
  } catch { return 'OPERADOR'; }
}

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Erro ao carregar');
  return res.json() as Promise<T>;
}

export default function MovimentacoesPage() {
  const [page, setPage] = useState(1);
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [perfil, setPerfil] = useState('OPERADOR');

  useEffect(() => { setPerfil(getMeuPerfil()); }, []);
  const isAdmin = perfil === 'MASTER' || perfil === 'ADMIN';

  const qs = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
  if (tipoFiltro) qs.set('tipo', tipoFiltro);
  if (dataInicio) qs.set('dataInicio', dataInicio);
  if (dataFim) qs.set('dataFim', dataFim);

  const { data, isLoading, mutate } = useSWR<{ data: MovimentacaoItem[]; meta: { total: number } }>(
    `${BASE_URL}/movimentacoes?${qs.toString()}`,
    fetcher,
  );

  const movimentacoes = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-px w-4 bg-cyan-500/50" />
            <span className="h-1 w-1 rounded-full bg-cyan-500" />
            <h1 className="text-2xl font-bold text-white">Movimentações</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {total > 0 ? `${total} movimentação${total !== 1 ? 'ões' : ''} registrada${total !== 1 ? 's' : ''}` : ''}
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30">
          <Plus className="h-4 w-4" />
          Nova movimentação
        </Button>
      </div>

      {/* Filtro por tipo */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {['', 'ENTRADA', 'SAIDA', 'AJUSTE', 'PERDA', 'DEVOLUCAO'].map((t) => (
            <button
              key={t}
              onClick={() => { setTipoFiltro(t); setPage(1); }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                tipoFiltro === t ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-slate-500 hover:text-slate-300 border border-white/5'
              }`}
            >
              {t === '' ? 'Todos' : TIPO_LABELS[t]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <label className="text-xs text-slate-400">De</label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => { setDataInicio(e.target.value); setPage(1); }}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          {(dataInicio || dataFim) && (
            <button
              onClick={() => { setDataInicio(''); setDataFim(''); setPage(1); }}
              className="text-xs text-slate-500 hover:text-white transition-colors"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div className="relative rounded-xl border border-white/5 bg-white/[0.03] overflow-hidden backdrop-blur-sm">
        <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Carregando...</div>
        ) : movimentacoes.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-sm">Nenhuma movimentação encontrada</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3 text-center">Qtd</th>
                <th className="px-4 py-3">Observação</th>
                <th className="px-4 py-3">Operador</th>
                <th className="px-4 py-3">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {movimentacoes.map((m) => (
                <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${TIPO_COLORS[m.tipo] ?? ''}`}>
                      {TIPO_LABELS[m.tipo] ?? m.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-white">{m.produtoNome}</div>
                    <div className="text-xs text-slate-500">{m.produtoSku}</div>
                  </td>
                  <td className="px-4 py-3 text-center font-medium text-white tabular-nums">{m.quantidade}</td>
                  <td className="px-4 py-3 text-slate-400 max-w-[200px] truncate">{m.observacao ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-400">{m.usuarioNome}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {new Date(m.criadoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginação */}
      {total > PAGE_SIZE && (
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

      {/* Modal */}
      {showModal && (
        <NovaMovimentacaoModal
          isAdmin={isAdmin}
          onClose={() => setShowModal(false)}
          onSaved={() => { mutate(); setShowModal(false); }}
        />
      )}
    </div>
  );
}

function NovaMovimentacaoModal({ isAdmin, onClose, onSaved }: {
  isAdmin: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  type TipoMovimentacao = 'ENTRADA' | 'AJUSTE' | 'PERDA' | 'DEVOLUCAO';

  const tiposDisponiveis: TipoMovimentacao[] = isAdmin
    ? ['ENTRADA', 'AJUSTE', 'PERDA', 'DEVOLUCAO']
    : ['ENTRADA', 'DEVOLUCAO'];

  const [tipo, setTipo] = useState<TipoMovimentacao>('ENTRADA');
  const [busca, setBusca] = useState('');
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoBusca | null>(null);
  const [quantidade, setQuantidade] = useState(1);
  const [custoUnitario, setCustoUnitario] = useState('');
  const [observacao, setObservacao] = useState('');
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState<FornecedorBusca | null>(null);
  const [buscaFornecedor, setBuscaFornecedor] = useState('');
  const [salvando, setSalvando] = useState(false);

  const debouncedBusca = useDebounce(busca, 300);
  const debouncedBuscaFornecedor = useDebounce(buscaFornecedor, 300);

  const { data: resultadosProduto } = useSWR<{ data: ProdutoBusca[] }>(
    debouncedBusca.length >= 2
      ? `${BASE_URL}/produtos?search=${encodeURIComponent(debouncedBusca)}&ativo=true&pageSize=8`
      : null,
    fetcher,
  );

  const { data: resultadosFornecedor } = useSWR<{ data: FornecedorBusca[] }>(
    tipo === 'ENTRADA' && debouncedBuscaFornecedor.length >= 2
      ? `${BASE_URL}/fornecedores?search=${encodeURIComponent(debouncedBuscaFornecedor)}&ativo=true&pageSize=8`
      : null,
    fetcher,
  );

  // Preenche custo unitário com o custo médio atual ao selecionar produto
  function selecionarProduto(p: ProdutoBusca) {
    setProdutoSelecionado(p);
    setBusca('');
    if (tipo === 'ENTRADA') setCustoUnitario(String(p.custoMedio > 0 ? p.custoMedio : ''));
  }

  const precisaObservacao = tipo === 'AJUSTE' || tipo === 'PERDA';

  async function handleSalvar() {
    if (!produtoSelecionado) return toast.error('Selecione um produto');
    if (tipo === 'ENTRADA' && (!custoUnitario || Number(custoUnitario) < 0))
      return toast.error('Informe o custo unitário');
    if (precisaObservacao && !observacao.trim())
      return toast.error('Observação é obrigatória para ' + TIPO_LABELS[tipo]);

    setSalvando(true);
    try {
      await apiClient.post('/movimentacoes', {
        tipo,
        produtoId: produtoSelecionado.id,
        quantidade,
        ...(tipo === 'ENTRADA' ? { custoUnitario: Number(custoUnitario) } : {}),
        ...(observacao.trim() ? { observacao } : {}),
        ...(fornecedorSelecionado ? { fornecedorId: fornecedorSelecionado.id } : {}),
      });
      toast.success('Movimentação registrada!');
      onSaved();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao registrar movimentação');
    } finally {
      setSalvando(false);
    }
  }

  const descricaoTipo: Record<TipoMovimentacao, string> = {
    ENTRADA: 'Recebimento de mercadoria — aumenta estoque e recalcula custo médio',
    AJUSTE: 'Correção manual de estoque (acréscimo)',
    PERDA: 'Avaria ou furto — diminui o estoque',
    DEVOLUCAO: 'Cliente devolveu — aumenta o estoque',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#080c14] p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Nova Movimentação</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Tipo */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Tipo</label>
            <div className={`grid gap-2 ${tiposDisponiveis.length === 4 ? 'grid-cols-4' : 'grid-cols-2'}`}>
              {tiposDisponiveis.map((t) => (
                <button
                  key={t}
                  onClick={() => { setTipo(t); setCustoUnitario(''); }}
                  className={`rounded-lg py-2 text-xs font-medium transition-colors ${
                    tipo === t ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-slate-500 hover:text-slate-300 border border-white/5'
                  }`}
                >
                  {TIPO_LABELS[t]}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500">{descricaoTipo[tipo]}</p>
          </div>

          {/* Busca de produto */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Produto</label>
            {produtoSelecionado ? (
              <div className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-800 px-3 py-2">
                <div>
                  <span className="text-sm text-white">{produtoSelecionado.nome}</span>
                  <span className="ml-2 text-xs text-slate-500">{produtoSelecionado.sku}</span>
                  <span className="ml-2 text-xs text-slate-500">Estoque: {produtoSelecionado.estoqueAtual}</span>
                </div>
                <button onClick={() => { setProdutoSelecionado(null); setCustoUnitario(''); }} className="text-slate-500 hover:text-red-400">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar por nome ou SKU..."
                  className={FIELD + ' pl-9'}
                />
                {resultadosProduto && resultadosProduto.data.length > 0 && busca.length >= 2 && (
                  <div className="absolute z-10 mt-1 w-full rounded-xl border border-white/10 bg-slate-800 shadow-xl overflow-hidden">
                    {resultadosProduto.data.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => selecionarProduto(p)}
                        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 text-left"
                      >
                        <span className="text-sm text-white">{p.nome}</span>
                        <span className="text-xs text-slate-500">{p.sku} · estoque: {p.estoqueAtual}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quantidade */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Quantidade</label>
            <input
              type="number"
              min={1}
              value={quantidade}
              onChange={(e) => setQuantidade(Math.max(1, Number(e.target.value)))}
              className={FIELD}
            />
          </div>

          {/* Custo unitário — só para ENTRADA */}
          {tipo === 'ENTRADA' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Custo unitário (R$) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={custoUnitario}
                onChange={(e) => setCustoUnitario(e.target.value)}
                placeholder="0,00"
                className={FIELD}
              />
              {produtoSelecionado && produtoSelecionado.custoMedio > 0 && (
                <p className="mt-1 text-[11px] text-slate-500">
                  Custo médio atual: R$ {produtoSelecionado.custoMedio.toFixed(2).replace('.', ',')}
                </p>
              )}
            </div>
          )}

          {/* Fornecedor — só para ENTRADA */}
          {tipo === 'ENTRADA' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Fornecedor (opcional)</label>
              {fornecedorSelecionado ? (
                <div className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-800 px-3 py-2">
                  <span className="text-sm text-white">{fornecedorSelecionado.razaoSocial}</span>
                  <button onClick={() => setFornecedorSelecionado(null)} className="text-slate-500 hover:text-red-400">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <input
                    value={buscaFornecedor}
                    onChange={(e) => setBuscaFornecedor(e.target.value)}
                    placeholder="Buscar fornecedor..."
                    className={FIELD + ' pl-9'}
                  />
                  {resultadosFornecedor && resultadosFornecedor.data.length > 0 && buscaFornecedor.length >= 2 && (
                    <div className="absolute z-10 mt-1 w-full rounded-xl border border-white/10 bg-slate-800 shadow-xl overflow-hidden">
                      {resultadosFornecedor.data.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => { setFornecedorSelecionado(f); setBuscaFornecedor(''); }}
                          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 text-left"
                        >
                          <span className="text-sm text-white">{f.razaoSocial}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Observação */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Observação {precisaObservacao && <span className="text-red-400">*</span>}
            </label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={2}
              placeholder={
                tipo === 'ENTRADA' ? 'Ex: NF 12345 — Distribuidora ABC' :
                tipo === 'AJUSTE' ? 'Ex: Contagem física revelou diferença' :
                tipo === 'PERDA' ? 'Ex: Produto avariado na prateleira' :
                'Ex: Cliente devolveu produto com defeito'
              }
              className={FIELD + ' resize-none'}
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-slate-400 hover:text-white transition-colors">
            Cancelar
          </button>
          <Button
            onClick={handleSalvar}
            disabled={salvando || !produtoSelecionado}
            className="flex-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 disabled:opacity-50"
          >
            {salvando ? 'Salvando...' : 'Registrar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
