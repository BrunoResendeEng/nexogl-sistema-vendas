'use client';

import { useState, useEffect } from 'react';
import { Plus, Pencil, X, Search, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import useSWR from 'swr';
import { useDebounce } from '@/hooks/use-debounce';

const BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api/v1';
const PAGE_SIZE = 20;

type Fornecedor = {
  id: string;
  razaoSocial: string;
  cnpj: string;
  telefone: string | null;
  email: string | null;
  contato: string | null;
  ativo: boolean;
  criadoEm: string;
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

function formatarCnpj(cnpj: string) {
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

export default function FornecedoresPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<Fornecedor | null>(null);
  const [perfil, setPerfil] = useState('OPERADOR');

  useEffect(() => { setPerfil(getMeuPerfil()); }, []);
  const isAdmin = perfil === 'MASTER' || perfil === 'ADMIN';

  const debouncedSearch = useDebounce(search, 300);

  const qs = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
  if (debouncedSearch) qs.set('search', debouncedSearch);

  const { data, isLoading, mutate } = useSWR<{ data: Fornecedor[]; meta: { total: number } }>(
    `${BASE_URL}/fornecedores?${qs.toString()}`,
    fetcher,
  );

  const fornecedores = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  async function handleToggle(f: Fornecedor) {
    try {
      await apiClient.patch(`/fornecedores/${f.id}/toggle`, { ativo: !f.ativo });
      toast.success(f.ativo ? 'Fornecedor desativado' : 'Fornecedor ativado');
      mutate();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao alterar status');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Fornecedores</h1>
          <p className="mt-1 text-sm text-slate-500">
            {total > 0 ? `${total} fornecedor${total !== 1 ? 'es' : ''} cadastrado${total !== 1 ? 's' : ''}` : ''}
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => { setEditando(null); setShowModal(true); }}
            className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 shadow-lg"
          >
            <Plus className="h-4 w-4" />
            Novo fornecedor
          </Button>
        )}
      </div>

      {/* Busca */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Buscar por razão social ou CNPJ..."
          className={FIELD + ' pl-9'}
        />
      </div>

      {/* Tabela */}
      <div className="relative rounded-xl border border-white/5 bg-white/[0.03] overflow-hidden backdrop-blur-sm">
        <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Carregando...</div>
        ) : fornecedores.length === 0 ? (
          <div className="p-16 text-center text-slate-500 text-sm flex flex-col items-center gap-3">
            <Building2 className="h-10 w-10 text-slate-700" />
            Nenhum fornecedor encontrado
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left text-xs text-slate-500 uppercase tracking-wider">
                <th className="px-4 py-3">Razão Social</th>
                <th className="px-4 py-3">CNPJ</th>
                <th className="px-4 py-3">Contato</th>
                <th className="px-4 py-3">Telefone</th>
                <th className="px-4 py-3">Status</th>
                {isAdmin && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {fornecedores.map((f) => (
                <tr key={f.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-white font-medium">{f.razaoSocial}</div>
                    {f.email && <div className="text-xs text-slate-500">{f.email}</div>}
                  </td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">{formatarCnpj(f.cnpj)}</td>
                  <td className="px-4 py-3 text-slate-400">{f.contato ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-400">{f.telefone ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      f.ativo ? 'bg-green-500/10 text-green-400' : 'bg-slate-500/10 text-slate-500'
                    }`}>
                      {f.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditando(f); setShowModal(true); }}
                          className="rounded-lg p-1.5 text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggle(f)}
                          className={`rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                            f.ativo
                              ? 'text-red-400 hover:bg-red-500/10'
                              : 'text-green-400 hover:bg-green-500/10'
                          }`}
                        >
                          {f.ativo ? 'Desativar' : 'Ativar'}
                        </button>
                      </div>
                    </td>
                  )}
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
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg px-3 py-1.5 hover:bg-white/5 disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg px-3 py-1.5 hover:bg-white/5 disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <FornecedorModal
          fornecedor={editando}
          onClose={() => setShowModal(false)}
          onSaved={() => { mutate(); setShowModal(false); }}
        />
      )}
    </div>
  );
}

function FornecedorModal({
  fornecedor,
  onClose,
  onSaved,
}: {
  fornecedor: Fornecedor | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [razaoSocial, setRazaoSocial] = useState(fornecedor?.razaoSocial ?? '');
  const [cnpj, setCnpj] = useState(fornecedor?.cnpj ?? '');
  const [telefone, setTelefone] = useState(fornecedor?.telefone ?? '');
  const [email, setEmail] = useState(fornecedor?.email ?? '');
  const [contato, setContato] = useState(fornecedor?.contato ?? '');
  const [salvando, setSalvando] = useState(false);

  // Máscara CNPJ no input
  function handleCnpj(v: string) {
    const nums = v.replace(/\D/g, '').slice(0, 14);
    setCnpj(nums);
  }

  async function handleSalvar() {
    if (!razaoSocial.trim()) return toast.error('Razão social é obrigatória');
    if (cnpj.length !== 14) return toast.error('CNPJ deve ter 14 dígitos');
    setSalvando(true);
    try {
      const body = { razaoSocial, cnpj, telefone: telefone || undefined, email: email || undefined, contato: contato || undefined };
      if (fornecedor) {
        await apiClient.patch(`/fornecedores/${fornecedor.id}`, body);
        toast.success('Fornecedor atualizado!');
      } else {
        await apiClient.post('/fornecedores', body);
        toast.success('Fornecedor cadastrado!');
      }
      onSaved();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative rounded-2xl border border-white/10 bg-[#080c14] p-6 shadow-2xl">
        <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">
            {fornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
          </h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Razão Social <span className="text-red-400">*</span>
            </label>
            <input value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} className={FIELD} placeholder="Ex: Distribuidora ABC Ltda" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              CNPJ <span className="text-red-400">*</span>
            </label>
            <input
              value={formatarCnpj(cnpj.padEnd(14, ' ').slice(0, 14)).replace(/\s/g, '')}
              onChange={(e) => handleCnpj(e.target.value)}
              className={FIELD + ' font-mono'}
              placeholder="00.000.000/0000-00"
              maxLength={18}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Telefone</label>
              <input value={telefone} onChange={(e) => setTelefone(e.target.value)} className={FIELD} placeholder="(00) 00000-0000" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Contato</label>
              <input value={contato} onChange={(e) => setContato(e.target.value)} className={FIELD} placeholder="Nome do responsável" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">E-mail</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className={FIELD} placeholder="contato@fornecedor.com" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 rounded-lg border border-white/10 py-2 text-sm text-slate-400 hover:text-white transition-colors">
            Cancelar
          </button>
          <Button
            onClick={handleSalvar}
            disabled={salvando}
            className="flex-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 disabled:opacity-50"
          >
            {salvando ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
