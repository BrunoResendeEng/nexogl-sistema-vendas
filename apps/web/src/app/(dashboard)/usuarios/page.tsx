'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Loader2, UserCheck, UserX, Shield, User } from 'lucide-react';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Perfil = 'MASTER' | 'ADMIN' | 'OPERADOR';

type Usuario = {
  id: string;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo: boolean;
};

type ListaResponse = {
  data: Usuario[];
  meta: { total: number; page: number; pageSize: number };
};

type MeuToken = { id: string; perfil: Perfil };

function getMeuToken(): MeuToken | null {
  try {
    const token = document.cookie.split('; ').find(r => r.startsWith('accessToken='))?.split('=')[1];
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]!)) as { sub: string; perfil: Perfil };
    return { id: payload.sub, perfil: payload.perfil };
  } catch { return null; }
}

const criarSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(8, 'Senha deve ter ao menos 8 caracteres'),
  perfil: z.enum(['MASTER', 'ADMIN', 'OPERADOR']),
});

const editarSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter ao menos 2 caracteres').optional(),
  email: z.string().email('E-mail inválido').optional(),
  perfil: z.enum(['MASTER', 'ADMIN', 'OPERADOR']).optional(),
});

type CriarInput = z.infer<typeof criarSchema>;
type EditarInput = z.infer<typeof editarSchema>;

const perfilBadge: Record<Perfil, string> = {
  MASTER: 'bg-purple-500/10 text-purple-400',
  ADMIN: 'bg-cyan-500/10 text-cyan-400',
  OPERADOR: 'bg-blue-500/10 text-blue-400',
};

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [modalCriar, setModalCriar] = useState(false);
  const [usuarioEditar, setUsuarioEditar] = useState<Usuario | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [eu, setEu] = useState<MeuToken | null>(null);

  useEffect(() => { setEu(getMeuToken()); }, []);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<ListaResponse>('/usuarios');
      setUsuarios(res.data);
      setTotal(res.meta.total);
    } catch (err) {
      if (err instanceof ApiClientError) toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  async function excluir(usuario: Usuario) {
    if (!window.confirm(`Excluir o usuário "${usuario.nome}"? Esta ação não pode ser desfeita.`)) return;
    setDeletingId(usuario.id);
    try {
      await apiClient.del(`/usuarios/${usuario.id}`);
      toast.success('Usuário excluído com sucesso');
      carregar();
    } catch (err) {
      if (err instanceof ApiClientError) toast.error(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleStatus(usuario: Usuario) {
    const acao = usuario.ativo ? 'desativar' : 'ativar';
    if (!window.confirm(`Deseja ${acao} o usuário "${usuario.nome}"?`)) return;
    setTogglingId(usuario.id);
    try {
      await apiClient.patch(`/usuarios/${usuario.id}/status`, { ativo: !usuario.ativo });
      toast.success(`Usuário ${!usuario.ativo ? 'ativado' : 'desativado'} com sucesso`);
      carregar();
    } catch (err) {
      if (err instanceof ApiClientError) toast.error(err.message);
    } finally {
      setTogglingId(null);
    }
  }

  function podeExcluir(u: Usuario): boolean {
    if (!eu) return false;
    if (u.id === eu.id) return false;
    if (u.perfil === 'MASTER' && eu.perfil !== 'MASTER') return false;
    return true;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-px w-4 bg-cyan-500/50" />
            <span className="h-1 w-1 rounded-full bg-cyan-500" />
            <h1 className="text-2xl font-bold text-white">Usuários</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {total} usuário{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={() => setModalCriar(true)}
          className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 shadow-lg"
        >
          <Plus className="h-4 w-4" />
          Novo usuário
        </Button>
      </div>

      <div className="relative rounded-xl border border-white/5 bg-white/[0.03] overflow-hidden backdrop-blur-sm">
        <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
          </div>
        ) : usuarios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <User className="h-10 w-10 text-slate-700" />
            <p className="mt-3 text-sm text-slate-500">Nenhum usuário cadastrado</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">E-mail</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Perfil</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {usuarios.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-white/[0.02]">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-semibold text-slate-300">
                        {u.nome.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-white">{u.nome}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${perfilBadge[u.perfil]}`}>
                      <Shield className="h-3 w-3" />
                      {u.perfil}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={u.ativo}
                        disabled={togglingId === u.id}
                        onCheckedChange={() => toggleStatus(u)}
                      />
                      <span className={`text-xs ${u.ativo ? 'text-green-400' : 'text-slate-500'}`}>
                        {u.ativo ? <UserCheck className="h-3.5 w-3.5" /> : <UserX className="h-3.5 w-3.5" />}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setUsuarioEditar(u)}
                        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-white/5 hover:text-white"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {podeExcluir(u) && (
                        <button
                          onClick={() => excluir(u)}
                          disabled={deletingId === u.id}
                          className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                        >
                          {deletingId === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ModalCriar
        open={modalCriar}
        euPerfil={eu?.perfil ?? 'OPERADOR'}
        onClose={() => setModalCriar(false)}
        onSuccess={() => { setModalCriar(false); carregar(); }}
      />

      <ModalEditar
        usuario={usuarioEditar}
        euPerfil={eu?.perfil ?? 'OPERADOR'}
        onClose={() => setUsuarioEditar(null)}
        onSuccess={() => { setUsuarioEditar(null); carregar(); }}
      />
    </div>
  );
}

function ModalCriar({ open, euPerfil, onClose, onSuccess }: {
  open: boolean;
  euPerfil: Perfil;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const form = useForm<CriarInput>({
    resolver: zodResolver(criarSchema),
    defaultValues: { nome: '', email: '', senha: '', perfil: 'OPERADOR' },
  });

  async function onSubmit(data: CriarInput) {
    try {
      await apiClient.post('/usuarios', data);
      toast.success('Usuário criado com sucesso');
      form.reset();
      onSuccess();
    } catch (err) {
      if (err instanceof ApiClientError) toast.error(err.message);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo usuário</DialogTitle>
          <DialogDescription>Preencha os dados para criar um novo usuário</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="nome" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-300">Nome</FormLabel>
                <FormControl>
                  <Input placeholder="Nome completo" className="border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:border-cyan-500" {...field} />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-300">E-mail</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="email@exemplo.com" className="border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:border-cyan-500" {...field} />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )} />
            <FormField control={form.control} name="senha" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-300">Senha</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Mínimo 8 caracteres" className="border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:border-cyan-500" {...field} />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )} />
            <FormField control={form.control} name="perfil" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-300">Perfil</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o perfil" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {euPerfil === 'MASTER' && <SelectItem value="MASTER">Master</SelectItem>}
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                    <SelectItem value="OPERADOR">Operador</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-red-400" />
              </FormItem>
            )} />
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white hover:bg-white/5">
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting} className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30">
                {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Criar usuário
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ModalEditar({ usuario, euPerfil, onClose, onSuccess }: {
  usuario: Usuario | null;
  euPerfil: Perfil;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const form = useForm<EditarInput>({
    resolver: zodResolver(editarSchema),
  });

  useEffect(() => {
    if (usuario) {
      form.reset({ nome: usuario.nome, email: usuario.email, perfil: usuario.perfil });
    }
  }, [usuario, form]);

  async function onSubmit(data: EditarInput) {
    if (!usuario) return;
    try {
      await apiClient.patch(`/usuarios/${usuario.id}`, data);
      toast.success('Usuário atualizado com sucesso');
      onSuccess();
    } catch (err) {
      if (err instanceof ApiClientError) toast.error(err.message);
    }
  }

  return (
    <Dialog open={!!usuario} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar usuário</DialogTitle>
          <DialogDescription>Altere os dados do usuário</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="nome" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-300">Nome</FormLabel>
                <FormControl>
                  <Input className="border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:border-cyan-500" {...field} />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-300">E-mail</FormLabel>
                <FormControl>
                  <Input type="email" className="border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:border-cyan-500" {...field} />
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )} />
            <FormField control={form.control} name="perfil" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-300">Perfil</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {euPerfil === 'MASTER' && <SelectItem value="MASTER">Master</SelectItem>}
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                    <SelectItem value="OPERADOR">Operador</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage className="text-red-400" />
              </FormItem>
            )} />
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white hover:bg-white/5">
                Cancelar
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting} className="bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30">
                {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
