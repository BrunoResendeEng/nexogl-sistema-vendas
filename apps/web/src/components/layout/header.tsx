'use client';

import { useRouter } from 'next/navigation';
import { LogOut, Bell, UserCircle } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient, ApiClientError } from '@/lib/api-client';

export function Header() {
  const router = useRouter();

  async function handleLogout() {
    try {
      await apiClient.post('/auth/logout', {});
    } catch (err) {
      if (err instanceof ApiClientError) {
        toast.error(err.message);
        return;
      }
    }
    router.push('/login');
  }

  return (
    <header className="relative flex h-16 items-center justify-between border-b border-white/5 bg-[#080c14] px-6 overflow-hidden">

      {/* Linha ciano no rodapé do header */}
      <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

      {/* Brilho sutil */}
      <div className="absolute -top-10 right-1/4 h-20 w-40 rounded-full bg-cyan-500/5 blur-2xl pointer-events-none" />

      {/* Lado esquerdo — decoração tech */}
      <div className="flex items-center gap-2">
        <span className="h-px w-4 bg-cyan-500/40" />
        <span className="h-1 w-1 rounded-full bg-cyan-500/60" />
      </div>

      {/* Lado direito — ações */}
      <div className="relative z-10 flex items-center gap-2">
        <button
          onClick={() => router.push('/perfil')}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-all hover:bg-cyan-500/10 hover:text-cyan-400 border border-transparent hover:border-cyan-500/20"
          title="Meu perfil"
        >
          <UserCircle className="h-4 w-4" />
        </button>

        <button className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-all hover:bg-cyan-500/10 hover:text-cyan-400 border border-transparent hover:border-cyan-500/20">
          <Bell className="h-4 w-4" />
        </button>

        <div className="mx-1 h-5 w-px bg-white/5" />

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-all hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </header>
  );
}
