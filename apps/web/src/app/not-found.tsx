import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold text-gray-900">404</h1>
      <p className="text-gray-500">Página não encontrada</p>
      <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">
        Voltar ao início
      </Link>
    </main>
  );
}
