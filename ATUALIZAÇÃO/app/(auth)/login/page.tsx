'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, X, Copy, Check } from 'lucide-react';
import { apiClient, ApiClientError } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const loginSchema = z.object({
  email: z.string().email({ message: 'E-mail inválido' }),
  senha: z.string().min(6, { message: 'Senha deve ter ao menos 6 caracteres' }),
});

const recuperarSchema = z.object({
  email: z.string().email({ message: 'E-mail inválido' }),
});

type LoginInput = z.infer<typeof loginSchema>;
type RecuperarInput = z.infer<typeof recuperarSchema>;

function ModalRecuperarSenha({ onClose }: { onClose: () => void }) {
  const [senhaTemporaria, setSenhaTemporaria] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const form = useForm<RecuperarInput>({
    resolver: zodResolver(recuperarSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(data: RecuperarInput) {
    try {
      const res = await apiClient.post<{ data: { senhaTemporaria: string } }>('/auth/recuperar-senha', data);
      setSenhaTemporaria(res.data.senhaTemporaria);
    } catch (err) {
      if (err instanceof ApiClientError) {
        form.setError('email', { message: err.message });
      } else {
        toast.error('Erro ao recuperar senha');
      }
    }
  }

  async function copiar() {
    if (!senhaTemporaria) return;
    await navigator.clipboard.writeText(senhaTemporaria);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-xl border border-white/10 bg-[#080c14] p-6 shadow-2xl">
        <div className="absolute inset-0 opacity-[0.02] rounded-xl" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: '24px 24px' }} />
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-500 hover:text-slate-300 transition-colors">
          <X className="h-4 w-4" />
        </button>

        <div className="relative z-10">
          <div className="mb-4 flex items-center gap-2">
            <span className="h-px w-4 bg-cyan-500/50" />
            <span className="h-1 w-1 rounded-full bg-cyan-500" />
            <h3 className="text-base font-semibold text-white">Recuperar senha</h3>
          </div>

          {!senhaTemporaria ? (
            <>
              <p className="mb-4 text-sm text-slate-400">Informe seu e-mail cadastrado. Uma senha temporária será gerada.</p>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-slate-400 text-xs uppercase tracking-wider">E-mail</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="seu@email.com"
                            autoFocus
                            className="border-white/10 bg-white/5 text-white placeholder:text-slate-600 focus-visible:border-cyan-500 focus-visible:ring-cyan-500/20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="w-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30"
                  >
                    {form.formState.isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Gerar senha temporária'}
                  </Button>
                </form>
              </Form>
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">Senha temporária gerada com sucesso. Use-a para entrar e depois altere no seu perfil.</p>
              <div className="flex items-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-3">
                <span className="flex-1 font-mono text-sm font-semibold text-cyan-400">{senhaTemporaria}</span>
                <button onClick={copiar} className="text-slate-400 hover:text-cyan-400 transition-colors">
                  {copiado ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
              <Button onClick={onClose} className="w-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30">
                Fechar e entrar
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [modalRecuperar, setModalRecuperar] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', senha: '' },
  });

  const isSubmitting = form.formState.isSubmitting;

  async function onSubmit(data: LoginInput) {
    try {
      await apiClient.post('/auth/login', data);
      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      if (!(err instanceof ApiClientError)) {
        toast.error('Não foi possível conectar. Tente novamente.');
        return;
      }
      if (err.code === 'CREDENCIAIS_INVALIDAS') {
        toast.error('E-mail ou senha incorretos');
        form.resetField('senha');
        return;
      }
      if (err.code === 'CONTA_BLOQUEADA') {
        toast.error(err.message);
        return;
      }
      toast.error(err.message);
    }
  }

  return (
    <div className="flex min-h-screen w-full">

      {/* Lado esquerdo — branding */}
      <div className="relative hidden lg:flex lg:w-1/2 flex-col items-center justify-center bg-[#080c14] overflow-hidden">

        {/* Brilho de fundo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-[100px]" />

        {/* Grid de pontos */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Conteúdo */}
        <div className="relative z-10 flex flex-col items-center text-center px-12">
          <img
            src="/logo-nexo.png"
            alt="Nexo GL Digital"
            className="rounded-full object-cover mb-8"
            style={{ width: 120, height: 120 }}
          />
          <h1 className="text-4xl font-black text-white tracking-tight">Nexo GL Digital</h1>
          <p className="mt-3 text-slate-400 text-base">Tecnologia sob medida para o seu negócio</p>

          {/* Divisor */}
          <div className="mt-8 w-16 h-px bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />

          <div className="mt-8 flex gap-4">
            {['SITES', 'SISTEMAS', 'DADOS'].map((tag) => (
              <span key={tag} className="rounded-full border border-cyan-500/30 px-4 py-1.5 text-xs text-cyan-400 font-mono tracking-widest">
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Rodapé esquerdo */}
        <p className="absolute bottom-6 text-xs text-slate-700">
          © {new Date().getFullYear()} Nexo GL Digital
        </p>
      </div>

      {/* Linha divisória com gradiente */}
      <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-cyan-500/40 to-transparent" />

      {/* Lado direito — formulário */}
      <div className="relative flex w-full lg:w-1/2 flex-col items-center justify-center bg-[#080c14] px-8 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-[100px]" />
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: '32px 32px' }} />
        <div className="relative z-10 w-full max-w-sm">

          {/* Logo mobile */}
          <div className="mb-8 flex flex-col items-center lg:hidden">
            <img
              src="/logo-nexo.png"
              alt="Nexo GL Digital"
              className="rounded-full object-cover mb-3"
              style={{ width: 72, height: 72 }}
            />
            <h1 className="text-xl font-bold text-white">Nexo GL Digital</h1>
          </div>

          {/* Título */}
          <div className="mb-8">
            <div className="mb-3 flex items-center gap-1">
            <div className="h-px w-8 bg-cyan-500" />
            <div className="h-px w-3 bg-cyan-500/40" />
            <div className="h-1 w-1 rounded-full bg-cyan-500" />
          </div>
            <h2 className="text-2xl font-bold text-white">Bem-vindo de volta</h2>
            <p className="mt-1 text-sm text-slate-500">Entre com suas credenciais para continuar</p>
          </div>

          {/* Formulário */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-400 text-xs uppercase tracking-wider">E-mail</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="seu@email.com"
                        autoFocus
                        autoComplete="email"
                        disabled={isSubmitting}
                        className="border-white/10 bg-white/5 text-white placeholder:text-slate-600 focus-visible:border-cyan-500 focus-visible:ring-cyan-500/20"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="senha"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-400 text-xs uppercase tracking-wider">Senha</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          disabled={isSubmitting}
                          className="border-white/10 bg-white/5 pr-10 text-white placeholder:text-slate-600 focus-visible:border-cyan-500 focus-visible:ring-cyan-500/20"
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-slate-300"
                          tabIndex={-1}
                          aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                className="mt-2 w-full bg-orange-500 font-semibold text-white shadow-lg shadow-orange-500/20 hover:bg-orange-600 focus-visible:ring-orange-500"
              >
                {isSubmitting
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Entrando...</>
                  : 'Entrar'
                }
              </Button>
            </form>
          </Form>

          <button
            type="button"
            onClick={() => setModalRecuperar(true)}
            className="mt-4 w-full text-center text-xs text-slate-500 hover:text-cyan-400 transition-colors"
          >
            Esqueci minha senha
          </button>

          <p className="mt-8 text-center text-xs text-slate-700">
            © {new Date().getFullYear()} Nexo GL Digital. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {modalRecuperar && <ModalRecuperarSenha onClose={() => setModalRecuperar(false)} />}
    </div>
  );
}
