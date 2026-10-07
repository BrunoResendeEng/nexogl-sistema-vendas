'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff, KeyRound } from 'lucide-react';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const schema = z.object({
  senhaAtual: z.string().min(1, { message: 'Informe a senha atual' }),
  novaSenha: z.string().min(8, { message: 'Nova senha deve ter ao menos 8 caracteres' }),
  confirmarSenha: z.string().min(1, { message: 'Confirme a nova senha' }),
}).refine((d) => d.novaSenha === d.confirmarSenha, {
  message: 'As senhas não coincidem',
  path: ['confirmarSenha'],
});

type FormInput = z.infer<typeof schema>;

export default function PerfilPage() {
  const [showAtual, setShowAtual] = useState(false);
  const [showNova, setShowNova] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

  const form = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: { senhaAtual: '', novaSenha: '', confirmarSenha: '' },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(data: FormInput) {
    try {
      await apiClient.post('/auth/alterar-senha', {
        senhaAtual: data.senhaAtual,
        novaSenha: data.novaSenha,
      });
      toast.success('Senha alterada com sucesso!');
      form.reset();
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.fields?.senhaAtual) {
          form.setError('senhaAtual', { message: err.fields.senhaAtual[0] });
        } else {
          toast.error(err.message);
        }
      } else {
        toast.error('Erro ao alterar senha');
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="h-px w-4 bg-cyan-500/50" />
          <span className="h-1 w-1 rounded-full bg-cyan-500" />
          <h1 className="text-2xl font-bold text-white">Meu Perfil</h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">Gerencie suas informações de acesso</p>
      </div>

      <div className="relative rounded-xl border border-white/5 bg-white/[0.03] p-6 overflow-hidden backdrop-blur-sm max-w-md">
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: '24px 24px' }} />
        <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

        <div className="relative z-10">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
              <KeyRound className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Alterar senha</p>
              <p className="text-xs text-slate-500">Mínimo de 8 caracteres</p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="senhaAtual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-400 text-xs uppercase tracking-wider">Senha atual</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showAtual ? 'text' : 'password'}
                          placeholder="••••••••"
                          disabled={isSubmitting}
                          className="border-white/10 bg-white/5 pr-10 text-white placeholder:text-slate-600 focus-visible:border-cyan-500 focus-visible:ring-cyan-500/20"
                          {...field}
                        />
                        <button type="button" onClick={() => setShowAtual((v) => !v)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                          {showAtual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="novaSenha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-400 text-xs uppercase tracking-wider">Nova senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showNova ? 'text' : 'password'}
                          placeholder="••••••••"
                          disabled={isSubmitting}
                          className="border-white/10 bg-white/5 pr-10 text-white placeholder:text-slate-600 focus-visible:border-cyan-500 focus-visible:ring-cyan-500/20"
                          {...field}
                        />
                        <button type="button" onClick={() => setShowNova((v) => !v)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                          {showNova ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmarSenha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-400 text-xs uppercase tracking-wider">Confirmar nova senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmar ? 'text' : 'password'}
                          placeholder="••••••••"
                          disabled={isSubmitting}
                          className="border-white/10 bg-white/5 pr-10 text-white placeholder:text-slate-600 focus-visible:border-cyan-500 focus-visible:ring-cyan-500/20"
                          {...field}
                        />
                        <button type="button" onClick={() => setShowConfirmar((v) => !v)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                          {showConfirmar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30 font-semibold"
              >
                {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar nova senha'}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}
