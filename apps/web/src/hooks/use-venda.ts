import useSWR from 'swr';

const BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api/v1';

export type VendaListItem = {
  id: string;
  numero: string;
  clienteNome: string | null;
  formaPagamento: string;
  subtotal: number;
  descontoAplicado: number;
  total: number;
  usuarioNome: string;
  criadoEm: string;
  canceladoEm: string | null;
};

export type ItemVendaDetalhe = {
  id: string;
  produtoId: string;
  produtoNome: string;
  produtoSku: string;
  quantidade: number;
  precoUnitario: number;
  custoUnitario: number;
  subtotal: number;
};

export type VendaDetalhe = VendaListItem & {
  clienteTelefone: string | null;
  clienteCpf: string | null;
  descontoPercentual: number;
  observacao: string | null;
  usuarioId: string;
  canceladoEm: string | null;
  canceladoPorNome: string | null;
  itens: ItemVendaDetalhe[];
};

async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Erro ao carregar');
  return res.json() as Promise<T>;
}

export function useVendaList(params: { page: number; pageSize: number; formaPagamento?: string }) {
  const qs = new URLSearchParams();
  qs.set('page', String(params.page));
  qs.set('pageSize', String(params.pageSize));
  if (params.formaPagamento) qs.set('formaPagamento', params.formaPagamento);

  const key = `${BASE_URL}/vendas?${qs.toString()}`;
  const { data, error, isLoading, mutate } = useSWR<{ data: VendaListItem[]; meta: { total: number } }>(key, fetcher);

  return { vendas: data?.data ?? [], meta: data?.meta, isLoading, error, mutate };
}

export function useVenda(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<VendaDetalhe>(
    id ? `${BASE_URL}/vendas/${id}` : null,
    fetcher,
  );
  return { venda: data, isLoading, error, mutate };
}
