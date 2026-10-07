'use client';

import { useState, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProdutoFilters } from '@/components/produto/produto-filters';
import { ProdutoTable } from '@/components/produto/produto-table';
import { ProdutoTableSkeleton } from '@/components/produto/produto-table-skeleton';
import { ProdutoEmptyState } from '@/components/produto/produto-empty-state';
import { useProdutoList, type ProdutoListItem, type ProdutoListParams } from '@/hooks/use-produto-list';
import { useDebounce } from '@/hooks/use-debounce';
import { ProdutoFormModal } from '@/components/produto/produto-form-modal';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';

function getMeuPerfil(): string {
  try {
    const token = document.cookie.split('; ').find(r => r.startsWith('accessToken='))?.split('=')[1];
    if (!token) return 'OPERADOR';
    const payload = JSON.parse(atob(token.split('.')[1]!)) as { perfil: string };
    return payload.perfil;
  } catch { return 'OPERADOR'; }
}

const PAGE_SIZE = 20;

export default function ProdutosPage() {
  const [search, setSearch] = useState('');
  const [categoria, setCategoria] = useState<ProdutoListParams['categoria']>(undefined);
  const [ativo, setAtivo] = useState<ProdutoListParams['ativo']>('');
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<ProdutoListItem | undefined>(undefined);

  const debouncedSearch = useDebounce(search, 300);

  const { produtos, meta, isLoading, mutate } = useProdutoList({
    search: debouncedSearch || undefined,
    categoria,
    ativo,
    page,
    pageSize: PAGE_SIZE,
  });

  const [perfil, setPerfil] = useState('OPERADOR');
  useEffect(() => { setPerfil(getMeuPerfil()); }, []);
  const isAdmin = perfil === 'MASTER' || perfil === 'ADMIN';
  const hasFilters = !!debouncedSearch || !!categoria || !!ativo;
  const totalPages = meta ? Math.ceil(meta.total / PAGE_SIZE) : 1;

  function handleSearch(v: string) {
    setSearch(v);
    setPage(1);
  }

  function handleCategoria(v: ProdutoListParams['categoria']) {
    setCategoria(v);
    setPage(1);
  }

  function handleAtivo(v: ProdutoListParams['ativo']) {
    setAtivo(v);
    setPage(1);
  }

  function handleEdit(p: ProdutoListItem) {
    setEditando(p);
    setShowForm(true);
  }
  function handleToggleStatus(p: ProdutoListItem) {
    const acao = p.ativo ? 'desativar' : 'ativar';
    if (!confirm(`Deseja ${acao} o produto "${p.nome}"?`)) return;
    apiClient.patch(`/produtos/${p.id}/status`, { ativo: !p.ativo })
      .then(() => mutate())
      .catch((err: unknown) => toast.error(err instanceof Error ? err.message : `Erro ao ${acao} produto`));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-px w-4 bg-cyan-500/50" />
            <span className="h-1 w-1 rounded-full bg-cyan-500" />
            <h1 className="text-2xl font-bold text-white">Produtos</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {meta ? `${meta.total} produto${meta.total !== 1 ? 's' : ''} encontrado${meta.total !== 1 ? 's' : ''}` : ''}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => { setEditando(undefined); setShowForm(true); }} className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30">
            <Plus className="h-4 w-4" />
            Novo produto
          </Button>
        )}
      </div>

      {/* Filtros */}
      <ProdutoFilters
        search={search}
        categoria={categoria}
        ativo={ativo}
        onSearch={handleSearch}
        onCategoria={handleCategoria}
        onAtivo={handleAtivo}
      />

      {/* Tabela */}
      <div className="relative rounded-xl border border-white/5 bg-white/[0.03] overflow-hidden backdrop-blur-sm">
        <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
        {isLoading ? (
          <ProdutoTableSkeleton />
        ) : produtos.length === 0 ? (
          <ProdutoEmptyState hasFilters={hasFilters} />
        ) : (
          <div className="overflow-x-auto">
            <ProdutoTable
              produtos={produtos}
              isAdmin={isAdmin}
              onEdit={handleEdit}
              onToggleStatus={handleToggleStatus}
            />
          </div>
        )}
      </div>

      {/* Paginação */}
      {meta && meta.total > PAGE_SIZE && (
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>
            Página {page} de {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg p-2 transition-colors hover:bg-white/5 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg p-2 transition-colors hover:bg-white/5 disabled:opacity-40"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      {showForm && (
        <ProdutoFormModal
          produto={editando}
          onClose={() => { setShowForm(false); setEditando(undefined); }}
          onSaved={() => { mutate(); setPage(1); }}
        />
      )}
    </div>
  );
}
