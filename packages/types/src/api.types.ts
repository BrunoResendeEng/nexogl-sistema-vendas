/** Envelope padrão de resposta de sucesso da API */
export type ApiResponse<T> = {
  data: T;
  meta?: ApiMeta;
};

/** Metadados de paginação */
export type ApiMeta = {
  total?: number;
  page?: number;
  pageSize?: number;
};

/** Envelope padrão de resposta de erro da API */
export type ApiError = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

/** Parâmetros de paginação padrão */
export type PaginacaoParams = {
  page?: number;
  pageSize?: number;
};
