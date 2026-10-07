'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { Categoria, ProdutoListParams } from '@/hooks/use-produto-list';

const CATEGORIAS: { value: Categoria; label: string }[] = [
  { value: 'MOT', label: 'Motor' },
  { value: 'FRE', label: 'Freio' },
  { value: 'TRA', label: 'Transmissão' },
  { value: 'ELE', label: 'Elétrica' },
  { value: 'SUS', label: 'Suspensão' },
  { value: 'PNE', label: 'Pneu / Câmara' },
  { value: 'ACC', label: 'Acessórios' },
  { value: 'OUT', label: 'Outros' },
];

type Props = {
  search: string;
  categoria: ProdutoListParams['categoria'];
  ativo: ProdutoListParams['ativo'];
  onSearch: (v: string) => void;
  onCategoria: (v: ProdutoListParams['categoria']) => void;
  onAtivo: (v: ProdutoListParams['ativo']) => void;
};

const selectClass =
  'h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white focus:outline-none focus:border-orange-500 [&>option]:bg-slate-900';

export function ProdutoFilters({ search, categoria, ativo, onSearch, onCategoria, onAtivo }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Buscar por nome, SKU, aplicação ou código de barras..."
          className="pl-9 border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:border-orange-500"
        />
      </div>

      <select
        value={categoria ?? ''}
        onChange={(e) => onCategoria((e.target.value as Categoria) || undefined)}
        className={selectClass}
      >
        <option value="">Todas as categorias</option>
        {CATEGORIAS.map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>

      <select
        value={ativo ?? ''}
        onChange={(e) => onAtivo((e.target.value as ProdutoListParams['ativo']) || '')}
        className={selectClass}
      >
        <option value="">Todos os status</option>
        <option value="true">Ativos</option>
        <option value="false">Inativos</option>
      </select>
    </div>
  );
}
