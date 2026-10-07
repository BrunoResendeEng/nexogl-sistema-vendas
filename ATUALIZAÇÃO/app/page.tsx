import { redirect } from 'next/navigation';

// Redireciona raiz para o dashboard (middleware cuida da auth)
export default function Home() {
  redirect('/dashboard');
}
