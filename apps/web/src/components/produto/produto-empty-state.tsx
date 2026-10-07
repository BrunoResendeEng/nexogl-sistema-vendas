import { Package } from 'lucide-react';

type Props = { hasFilters: boolean };

export function ProdutoEmptyState({ hasFilters }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Package className="h-10 w-10 text-slate-700" />
      <p className="mt-3 text-sm font-medium text-slate-400">
        {hasFilters ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
      </p>
      <p className="mt-1 text-xs text-slate-600">
        {hasFilters ? 'Tente ajustar os filtros' : 'Clique em "Novo produto" para começar'}
      </p>
    </div>
  );
}
