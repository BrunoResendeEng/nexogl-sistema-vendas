import useSWR from 'swr';

const BASE_URL = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api/v1';

export type Categoria = 'MOT' | 'FRE' | 'TRA' | 'ELE' | 'SUS' | 'PNE' | 'ACC' | 'OUT';

export type ProdutoListItem = {
  id: string;
  sku: string;
  nome: string;
  categoria: Categoria;
  aplicacao: string | null;
  estoqueAtual: number;
  estoqueMinimo: number;
  precoVenda: number | null;
  ativo: boolean;
};

export type ProdutoListParams = {
  search?: string;
  categoria?: Categoria | '';
  ativo?: 'true' | 'false' | '';
  page: number;
  pageSize: number;
};

type ProdutoListResponse = {
  data: ProdutoListItem[];
  meta: { total: number; page: number; pageSize: number };
};

async function fetcher(url: string): Promise<ProdutoListResponse> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Erro ao carregar produtos');
  return res.json() as Promise<ProdutoListResponse>;
}

export function useProdutoList(params: ProdutoListParams) {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.categoria) qs.set('categoria', params.categoria);
  if (params.ativo !== '' && params.ativo !== undefined) qs.set('ativo', params.ativo);
  qs.set('page', String(params.page));
  qs.set('pageSize', String(params.pageSize));

  const key = `${BASE_URL}/produtos?${qs.toString()}`;

  const { data, error, isLoading, mutate } = useSWR<ProdutoListResponse>(key, fetcher);

  return {
    produtos: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    error,
    mutate,
  };
}
