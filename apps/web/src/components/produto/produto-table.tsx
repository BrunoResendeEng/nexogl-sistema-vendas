import { Pencil, Power } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProdutoStatusBadge } from './produto-status-badge';
import { ProdutoEstoqueCell } from './produto-estoque-cell';
import type { ProdutoListItem } from '@/hooks/use-produto-list';

const CATEGORIA_LABEL: Record<string, string> = {
  MOT: 'Motor', FRE: 'Freio', TRA: 'Transmissão', ELE: 'Elétrica',
  SUS: 'Suspensão', PNE: 'Pneu', ACC: 'Acessórios', OUT: 'Outros',
};

type Props = {
  produtos: ProdutoListItem[];
  isAdmin: boolean;
  onEdit: (p: ProdutoListItem) => void;
  onToggleStatus: (p: ProdutoListItem) => void;
};

export function ProdutoTable({ produtos, isAdmin, onEdit, onToggleStatus }: Props) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-white/5">
          {['SKU', 'Nome', 'Categoria', 'Aplicação', 'Estoque', 'Mín.', 'Preço venda', 'Status', 'Ações'].map((h) => (
            <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-white/5">
        {produtos.map((p) => (
          <tr
            key={p.id}
            className={cn(
              'transition-colors hover:bg-white/[0.02]',
              !p.ativo && 'opacity-60',
            )}
          >
            <td className="px-4 py-3 font-mono text-xs text-slate-400">{p.sku}</td>
            <td className="px-4 py-3 text-sm font-medium text-white max-w-[180px] truncate">{p.nome}</td>
            <td className="px-4 py-3 text-sm text-slate-400">{CATEGORIA_LABEL[p.categoria] ?? p.categoria}</td>
            <td className="px-4 py-3 text-sm text-slate-400 max-w-[140px] truncate">{p.aplicacao ?? '—'}</td>
            <td className="px-4 py-3">
              <ProdutoEstoqueCell atual={p.estoqueAtual} minimo={p.estoqueMinimo} />
            </td>
            <td className="px-4 py-3 text-sm text-slate-400 tabular-nums">{p.estoqueMinimo}</td>
            <td className="px-4 py-3 text-sm text-slate-400 tabular-nums">
              {p.precoVenda != null
                ? p.precoVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                : '—'}
            </td>
            <td className="px-4 py-3">
              <ProdutoStatusBadge ativo={p.ativo} />
            </td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEdit(p)}
                  className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-white/5 hover:text-white"
                  title="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                {isAdmin && (
                  <button
                    onClick={() => onToggleStatus(p)}
                    className={cn(
                      'rounded-lg p-2 transition-colors',
                      p.ativo
                        ? 'text-slate-500 hover:bg-red-500/10 hover:text-red-400'
                        : 'text-slate-500 hover:bg-green-500/10 hover:text-green-400',
                    )}
                    title={p.ativo ? 'Desativar' : 'Ativar'}
                  >
                    <Power className="h-4 w-4" />
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
