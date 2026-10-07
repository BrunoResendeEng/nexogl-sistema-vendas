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

async function tryRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}

function redirectToLogin() {
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
  isRetry = false,
): Promise<T> {
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

  const data = response.status === 204 ? null : (await response.json()) as unknown;

  if (!response.ok) {
    const errorData = data as {
      error?: { code?: string; message?: string; details?: unknown };
    };
    const error = errorData?.error;
    const code = error?.code ?? 'ERRO_DESCONHECIDO';
    const message = error?.message ?? 'Erro desconhecido';

    // Token expirado — tenta refresh uma vez
    if (code === 'TOKEN_EXPIRADO' && !isRetry) {
      const refreshed = await tryRefresh();
      if (refreshed) {
        return request<T>(path, options, true);
      }
      redirectToLogin();
    }

    throw new ApiClientError(code, message, response.status, error?.details);
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
