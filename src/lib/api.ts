const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export interface ApiError {
  success: false;
  message: string;
  field?: string;
}

export async function api<T>(path: string, options?: RequestInit): Promise<T> {
  const isFormData = options?.body instanceof FormData;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: isFormData
      ? { ...options?.headers }
      : { 'Content-Type': 'application/json', ...options?.headers },
  });

  const body = await res.json();

  if (!body.success) {
    throw body as ApiError;
  }

  return body.data as T;
}
