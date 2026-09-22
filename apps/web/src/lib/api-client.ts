/**
 * Wrapper de fetch para a API Fastify.
 * - Inclui credentials: 'include' em todas as requisições (cookies HttpOnly)
 * - Padroniza headers e tratamento de erro
 * - Base URL via NEXT_PUBLIC_API_URL
 */

const BASE_URL =
  process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api/v1';

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
};

export class ApiClientError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(code: string, message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers, ...rest } = options;

  const response = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await response.json() as unknown;

  if (!response.ok) {
    const errorData = data as { error?: { code?: string; message?: string; details?: unknown } };
    const error = errorData?.error;
    throw new ApiClientError(
      error?.code ?? 'ERRO_DESCONHECIDO',
      error?.message ?? 'Erro desconhecido',
      response.status,
      error?.details,
    );
  }

  return data as T;
}

export const apiClient = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'body'>) =>
    request<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body: unknown, options?: Omit<RequestOptions, 'body'>) =>
    request<T>(path, { ...options, method: 'POST', body }),

  patch: <T>(path: string, body: unknown, options?: Omit<RequestOptions, 'body'>) =>
    request<T>(path, { ...options, method: 'PATCH', body }),

  put: <T>(path: string, body: unknown, options?: Omit<RequestOptions, 'body'>) =>
    request<T>(path, { ...options, method: 'PUT', body }),

  del: <T>(path: string, options?: Omit<RequestOptions, 'body'>) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
