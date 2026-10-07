'use client';

import { useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import useSWR from 'swr';

const BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api/v1';

const FORMA_LABELS: Record<string, string> = { DINHEIRO: 'Dinheiro', PIX: 'PIX', CARTAO: 'Cartão' };
const CATEGORIA_LABEL: Record<string, string> = {
  MOT: 'Motor', FRE: 'Freio', TRA: 'Transmissão', ELE: 'Elétrica',
  SUS: 'Suspensão', PNE: 'Pneu', ACC: 'Acessórios', OUT: 'Outros',
};

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

function inicioMes() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Erro ao carregar');
  return res.json() as Promise<T>;
}

function exportCsv(filename: string, headers: string[], rows: string[][]) {
  const bom = '\uFEFF';
  const content = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(';')).join('\n');
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

type VendasData = {
  itens: {
    id: string; numero: string; clienteNome: string | null; formaPagamento: string;
    subtotal: number; descontoAplicado: number; total: number;
    usuarioNome: string; criadoEm: string; totalItens: number;
  }[];
  resumo: {
    totalVendas: number; totalFaturamento: number; totalDesconto: number;
    porFormaPagamento: { forma: string; quantidade: number; total: number }[];
  };
};

type MaisVendidoItem = {
  produtoId: string; produtoSku: string; produtoNome: string;
  categoria: string; totalQuantidade: number; totalReceita: number;
};

type ProdutoParadoItem = {
  id: string; sku: string; nome: string; categoria: string;
  estoqueAtual: number; custoMedio: number; valorEstoque: number;
  ultimaMovimentacao: string | null; diasParado: number;
};

type PosicaoEstoqueData = {
  itens: {
    id: string; sku: string; nome: string; categoria: string; unidade: string;
    estoqueAtual: number; estoqueMinimo: number; custoMedio: number;
    precoVenda: number | null; valorEstoque: number; status: 'OK' | 'BAIXO' | 'SEM_ESTOQUE';
  }[];
  totalValorEstoque: number;
};

// ─── Componente principal ─────────────────────────────────────────────────────

type Aba = 'vendas' | 'mais-vendidos' | 'parados' | 'posicao-estoque';

export default function RelatoriosPage() {
  const [aba, setAba] = useState<Aba>('vendas');
  const [dataInicio, setDataInicio] = useState(inicioMes());
  const [dataFim, setDataFim] = useState(hoje());

  const abas: { id: Aba; label: string }[] = [
    { id: 'vendas', label: 'Vendas por período' },
    { id: 'mais-vendidos', label: 'Mais vendidos' },
    { id: 'parados', label: 'Produtos parados' },
    { id: 'posicao-estoque', label: 'Posição de estoque' },
  ];

  const precisaPeriodo = aba === 'vendas' || aba === 'mais-vendidos';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-px w-4 bg-cyan-500/50" />
            <span className="h-1 w-1 rounded-full bg-cyan-500" />
            <h1 className="text-2xl font-bold text-white">Relatórios</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">Análises e exportações</p>
        </div>
        <Button
          onClick={() => window.print()}
          variant="outline"
          className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5"
        >
          <Printer className="h-4 w-4" />
          Imprimir
        </Button>
      </div>

      {/* Abas */}
      <div className="flex gap-1 rounded-xl bg-white/[0.03] border border-white/5 p-1">
        {abas.map((a) => (
          <button
            key={a.id}
            onClick={() => setAba(a.id)}
            className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${
              aba === a.id ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-500 hover:text-white border border-transparent'
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Filtros de período */}
      {precisaPeriodo && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">De</label>
            <input
              type="date"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400">até</label>
            <input
              type="date"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>
      )}

      {/* Conteúdo por aba */}
      {aba === 'vendas' && <AbaVendas dataInicio={dataInicio} dataFim={dataFim} />}
      {aba === 'mais-vendidos' && <AbaMaisVendidos dataInicio={dataInicio} dataFim={dataFim} />}
      {aba === 'parados' && <AbaProdutosParados />}
      {aba === 'posicao-estoque' && <AbaPosicaoEstoque />}
    </div>
  );
}

// ─── Aba Vendas ───────────────────────────────────────────────────────────────

function AbaVendas({ dataInicio, dataFim }: { dataInicio: string; dataFim: string }) {
  const { data, isLoading } = useSWR<VendasData>(
    dataInicio && dataFim
      ? `${BASE_URL}/relatorios/vendas?dataInicio=${dataInicio}&dataFim=${dataFim}`
      : null,
    fetcher,
  );

  function handleExport() {
    if (!data) return;
    exportCsv(
      `vendas-${dataInicio}-${dataFim}.csv`,
      ['Número', 'Data', 'Cliente', 'Pagamento', 'Subtotal', 'Desconto', 'Total', 'Operador', 'Itens'],
      data.itens.map((v) => [
        v.numero,
        new Date(v.criadoEm).toLocaleString('pt-BR'),
        v.clienteNome ?? '',
        FORMA_LABELS[v.formaPagamento] ?? v.formaPagamento,
        v.subtotal.toFixed(2),
        v.descontoAplicado.toFixed(2),
        v.total.toFixed(2),
        v.usuarioNome,
        String(v.totalItens),
      ]),
    );
  }

  if (isLoading) return <Loading />;
  if (!data) return null;

  const { resumo, itens } = data;

  return (
    <div className="space-y-4">
      {/* Cards resumo */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <CardResumo label="Total de vendas" value={String(resumo.totalVendas)} />
        <CardResumo label="Faturamento" value={fmt(resumo.totalFaturamento)} />
        <CardResumo label="Descontos" value={fmt(resumo.totalDesconto)} sub="PIX" />
        {resumo.porFormaPagamento.map((f) => (
          <CardResumo
            key={f.forma}
            label={FORMA_LABELS[f.forma] ?? f.forma}
            value={fmt(f.total)}
            sub={`${f.quantidade} venda${f.quantidade !== 1 ? 's' : ''}`}
          />
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleExport} variant="outline" className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5 text-xs">
          <Download className="h-3.5 w-3.5" />
          Exportar CSV
        </Button>
      </div>

      <div className="relative rounded-xl border border-white/5 bg-white/[0.03] overflow-hidden backdrop-blur-sm">
        {itens.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">Nenhuma venda no período</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3">Número</th>
                <th className="px-4 py-3">Data</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Pagamento</th>
                <th className="px-4 py-3 text-right">Desconto</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Operador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {itens.map((v) => (
                <tr key={v.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-mono text-cyan-400">{v.numero}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {new Date(v.criadoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{v.clienteNome ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-400">{FORMA_LABELS[v.formaPagamento] ?? v.formaPagamento}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-green-400 text-xs">
                    {v.descontoAplicado > 0 ? `- ${fmt(v.descontoAplicado)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-white">{fmt(v.total)}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{v.usuarioNome}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/10 bg-white/[0.02]">
                <td colSpan={5} className="px-4 py-3 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">Total</td>
                <td className="px-4 py-3 text-right font-bold text-white">{fmt(resumo.totalFaturamento)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Aba Mais Vendidos ────────────────────────────────────────────────────────

function AbaMaisVendidos({ dataInicio, dataFim }: { dataInicio: string; dataFim: string }) {
  const { data, isLoading } = useSWR<MaisVendidoItem[]>(
    dataInicio && dataFim
      ? `${BASE_URL}/relatorios/mais-vendidos?dataInicio=${dataInicio}&dataFim=${dataFim}`
      : null,
    fetcher,
  );

  function handleExport() {
    if (!data) return;
    exportCsv(
      `mais-vendidos-${dataInicio}-${dataFim}.csv`,
      ['SKU', 'Produto', 'Categoria', 'Qtd Vendida', 'Receita Total'],
      data.map((p) => [
        p.produtoSku, p.produtoNome,
        CATEGORIA_LABEL[p.categoria] ?? p.categoria,
        String(p.totalQuantidade), p.totalReceita.toFixed(2),
      ]),
    );
  }

  if (isLoading) return <Loading />;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleExport} variant="outline" className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5 text-xs">
          <Download className="h-3.5 w-3.5" />
          Exportar CSV
        </Button>
      </div>
      <div className="relative rounded-xl border border-white/5 bg-white/[0.03] overflow-hidden backdrop-blur-sm">
        {data.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">Nenhuma venda no período</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3 text-right">Qtd vendida</th>
                <th className="px-4 py-3 text-right">Receita</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.map((p, i) => (
                <tr key={p.produtoId} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-slate-500 tabular-nums">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="text-white">{p.produtoNome}</div>
                    <div className="text-xs text-slate-500">{p.produtoSku}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{CATEGORIA_LABEL[p.categoria] ?? p.categoria}</td>
                  <td className="px-4 py-3 text-right font-medium text-white tabular-nums">{p.totalQuantidade}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{fmt(p.totalReceita)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Aba Produtos Parados ─────────────────────────────────────────────────────

function AbaProdutosParados() {
  const [dias, setDias] = useState(90);
  const { data, isLoading } = useSWR<ProdutoParadoItem[]>(
    `${BASE_URL}/relatorios/parados?dias=${dias}`,
    fetcher,
  );

  function handleExport() {
    if (!data) return;
    exportCsv(
      `produtos-parados-${dias}d.csv`,
      ['SKU', 'Produto', 'Categoria', 'Estoque', 'Custo Médio', 'Valor Estoque', 'Dias Parado', 'Última Movimentação'],
      data.map((p) => [
        p.sku, p.nome, CATEGORIA_LABEL[p.categoria] ?? p.categoria,
        String(p.estoqueAtual), p.custoMedio.toFixed(2), p.valorEstoque.toFixed(2),
        String(p.diasParado),
        p.ultimaMovimentacao ? new Date(p.ultimaMovimentacao).toLocaleDateString('pt-BR') : 'Nunca',
      ]),
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400">Sem movimentação há mais de</label>
          <select
            value={dias}
            onChange={(e) => setDias(Number(e.target.value))}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            {[30, 60, 90, 120, 180].map((d) => (
              <option key={d} value={d}>{d} dias</option>
            ))}
          </select>
        </div>
        <Button onClick={handleExport} variant="outline" className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5 text-xs">
          <Download className="h-3.5 w-3.5" />
          Exportar CSV
        </Button>
      </div>

      {isLoading ? <Loading /> : (
        <div className="relative rounded-xl border border-white/5 bg-white/[0.03] overflow-hidden backdrop-blur-sm">
          {!data || data.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">Nenhum produto parado no período</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3 text-right">Estoque</th>
                  <th className="px-4 py-3 text-right">Valor estoque</th>
                  <th className="px-4 py-3 text-right">Dias parado</th>
                  <th className="px-4 py-3">Última movimentação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3">
                      <div className="text-white">{p.nome}</div>
                      <div className="text-xs text-slate-500">{p.sku}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{CATEGORIA_LABEL[p.categoria] ?? p.categoria}</td>
                    <td className="px-4 py-3 text-right text-white tabular-nums">{p.estoqueAtual}</td>
                    <td className="px-4 py-3 text-right text-slate-300">{fmt(p.valorEstoque)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-orange-400 font-medium tabular-nums">{p.diasParado}d</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {p.ultimaMovimentacao
                        ? new Date(p.ultimaMovimentacao).toLocaleDateString('pt-BR')
                        : <span className="text-red-400">Nunca</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Aba Posição de Estoque ───────────────────────────────────────────────────

const STATUS_STYLE: Record<string, string> = {
  OK: 'bg-green-500/10 text-green-400',
  BAIXO: 'bg-amber-500/10 text-amber-400',
  SEM_ESTOQUE: 'bg-red-500/10 text-red-400',
};
const STATUS_LABEL: Record<string, string> = {
  OK: 'OK', BAIXO: 'Baixo', SEM_ESTOQUE: 'Sem estoque',
};

function AbaPosicaoEstoque() {
  const [filtroStatus, setFiltroStatus] = useState('');
  const { data, isLoading } = useSWR<PosicaoEstoqueData>(
    `${BASE_URL}/relatorios/posicao-estoque`,
    fetcher,
  );

  const itens = data?.itens.filter((p) => !filtroStatus || p.status === filtroStatus) ?? [];

  function handleExport() {
    if (!data) return;
    exportCsv(
      `posicao-estoque-${hoje()}.csv`,
      ['SKU', 'Produto', 'Categoria', 'Unidade', 'Estoque', 'Mínimo', 'Custo Médio', 'Preço Venda', 'Valor Estoque', 'Status'],
      data.itens.map((p) => [
        p.sku, p.nome, CATEGORIA_LABEL[p.categoria] ?? p.categoria, p.unidade,
        String(p.estoqueAtual), String(p.estoqueMinimo),
        p.custoMedio.toFixed(2), p.precoVenda?.toFixed(2) ?? '',
        p.valorEstoque.toFixed(2), STATUS_LABEL[p.status] ?? p.status,
      ]),
    );
  }

  if (isLoading) return <Loading />;
  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['', 'SEM_ESTOQUE', 'BAIXO', 'OK'].map((s) => (
            <button
              key={s}
              onClick={() => setFiltroStatus(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                filtroStatus === s ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-slate-500 hover:text-slate-300 border border-white/5'
              }`}
            >
              {s === '' ? 'Todos' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-400">
            Valor total: <span className="text-white font-semibold">{fmt(data.totalValorEstoque)}</span>
          </span>
          <Button onClick={handleExport} variant="outline" className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5 text-xs">
            <Download className="h-3.5 w-3.5" />
            Exportar CSV
          </Button>
        </div>
      </div>

      <div className="relative rounded-xl border border-white/5 bg-white/[0.03] overflow-hidden backdrop-blur-sm">
        {itens.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">Nenhum produto encontrado</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3 text-right">Estoque</th>
                <th className="px-4 py-3 text-right">Mínimo</th>
                <th className="px-4 py-3 text-right">Custo médio</th>
                <th className="px-4 py-3 text-right">Preço venda</th>
                <th className="px-4 py-3 text-right">Valor estoque</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {itens.map((p) => (
                <tr key={p.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <div className="text-white">{p.nome}</div>
                    <div className="text-xs text-slate-500">{p.sku}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{CATEGORIA_LABEL[p.categoria] ?? p.categoria}</td>
                  <td className="px-4 py-3 text-right font-medium text-white tabular-nums">{p.estoqueAtual}</td>
                  <td className="px-4 py-3 text-right text-slate-500 tabular-nums">{p.estoqueMinimo}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{fmt(p.custoMedio)}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{p.precoVenda ? fmt(p.precoVenda) : '—'}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{fmt(p.valorEstoque)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[p.status] ?? ''}`}>
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function CardResumo({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.03] p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-white">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

function Loading() {
  return <div className="p-12 text-center text-slate-500 text-sm">Carregando...</div>;
}
