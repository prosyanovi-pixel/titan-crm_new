import { z } from 'zod';
// Используем относительные пути, так как прокси настроен на /api -> localhost:5001
const API_URL = import.meta.env.VITE_API_URL || '/api';

// Получаем ID текущего пользователя из локального хранилища
const getCurrentUserId = () => {
    return localStorage.getItem('titan_user_id') || '2';
};

// Получаем JWT токен из локального хранилища
export const getAuthToken = () => {
    return localStorage.getItem('titan_token');
};

// Стандартные заголовки для всех запросов
const getHeaders = (extraHeaders?: HeadersInit) => {
    const userId = getCurrentUserId();
    const token = getAuthToken();
    
    const headers: HeadersInit = {
        'x-user-id': userId,
    };

    // Добавляем JWT токен если есть
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return { ...headers, ...extraHeaders };
};

export const api = {
  get: async (endpoint: string, options?: { responseType?: 'json' | 'blob', params?: Record<string, any> }) => {
    // Добавляем query параметры если есть
    let url = endpoint.startsWith('/') ? `${API_URL}${endpoint}` : `${API_URL}/${endpoint}`;
    if (options?.params) {
      const queryParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      const queryString = queryParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    const response = await fetch(url, {
        headers: getHeaders()
    });

    // Если токен истёк (401), перенаправляем на логин
    if (response.status === 401) {
        console.error('[API] 401 Unauthorized - session expired, redirecting to login');
        
        localStorage.removeItem('titan_token');
        localStorage.removeItem('titan_user_id');
        localStorage.removeItem('titan_user_role');
        window.location.href = '/login';
        throw new Error('Срок действия сессии истёк');
    }

    if (!response.ok) {
      if (response.status === 403) throw new Error("Нет прав доступа (403)");
      const body = await response.json().catch(() => ({}));
      const err = Object.assign(new Error(body.error ?? `API Error: ${response.statusText}`), body, { status: response.status });
      throw err;
    }
    if (options?.responseType === 'blob') {
      return response.blob();
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return null;
    }

    return response.json();
  },
  post: async (endpoint: string, data?: unknown, options?: RequestInit & { responseType?: 'json' | 'blob' }) => {
    const isFormData = data instanceof FormData;

    const response = await fetch(endpoint.startsWith('/') ? `${API_URL}${endpoint}` : `${API_URL}/${endpoint}`, {
      method: 'POST',
      headers: getHeaders(isFormData ? {} : { 'Content-Type': 'application/json' }),
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
      ...options
    });

    // Если токен истёк (401), перенаправляем на логин
    if (response.status === 401) {
        console.error('[API] 401 Unauthorized - session expired, redirecting to login');
        localStorage.removeItem('titan_token');
        localStorage.removeItem('titan_user_id');
        localStorage.removeItem('titan_user_role');
        window.location.href = '/login';
        throw new Error('Срок действия сессии истёк');
    }

    if (!response.ok) {
        if (response.status === 403) throw new Error("Нет прав доступа (403)");
        const body = await response.json().catch(() => ({}));
        const err = Object.assign(new Error(body.error ?? `API Error: ${response.statusText}`), body, { status: response.status });
        throw err;
    }

    if (options?.responseType === 'blob') {
      return response.blob();
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return null;
    }

    return response.json();
  },
  put: async (endpoint: string, data?: unknown) => {
    const url = endpoint.startsWith('/') ? `${API_URL}${endpoint}` : `${API_URL}/${endpoint}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: data ? JSON.stringify(data) : undefined,
    });

    // Если токен истёк (401), перенаправляем на логин
    if (response.status === 401) {
        localStorage.removeItem('titan_token');
        localStorage.removeItem('titan_user_id');
        localStorage.removeItem('titan_user_role');
        window.location.href = '/login';
        throw new Error('Срок действия сессии истёк');
    }

    if (!response.ok) {
        if (response.status === 403) throw new Error("Нет прав доступа (403)");
        throw new Error(`API Error: ${response.statusText}`);
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return null;
    }

    return response.json();
  },
  patch: async (endpoint: string, data?: unknown) => {
    const url = endpoint.startsWith('/') ? `${API_URL}${endpoint}` : `${API_URL}/${endpoint}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: getHeaders({ 'Content-Type': 'application/json' }),
      body: data ? JSON.stringify(data) : undefined,
    });

    // Если токен истёк (401), перенаправляем на логин
    if (response.status === 401) {
        localStorage.removeItem('titan_token');
        localStorage.removeItem('titan_user_id');
        localStorage.removeItem('titan_user_role');
        window.location.href = '/login';
        throw new Error('Срок действия сессии истёк');
    }

    if (!response.ok) {
        if (response.status === 403) throw new Error("Нет прав доступа (403)");
        throw new Error(`API Error: ${response.statusText}`);
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return null;
    }

    return response.json();
  },
  
  getParsed: async <T>(endpoint: string, schema: z.ZodType<T>, options?: { params?: Record<string, any> }): Promise<T> => {
    const data = await api.get(endpoint, options);
    if (!data) throw new Error('No data returned');
    return schema.parse(data);
  },
  postParsed: async <T>(endpoint: string, payload: unknown, schema: z.ZodType<T>, options?: RequestInit): Promise<T> => {
    const data = await api.post(endpoint, payload, options);
    if (!data) throw new Error('No data returned');
    return schema.parse(data);
  },

  delete: async (endpoint: string) => {
    const url = endpoint.startsWith('/') ? `${API_URL}${endpoint}` : `${API_URL}/${endpoint}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getHeaders()
    });

    // Если токен истёк (401), перенаправляем на логин
    if (response.status === 401) {
        localStorage.removeItem('titan_token');
        localStorage.removeItem('titan_user_id');
        localStorage.removeItem('titan_user_role');
        window.location.href = '/login';
        throw new Error('Срок действия сессии истёк');
    }

    if (!response.ok) {
        if (response.status === 403) throw new Error("Нет прав доступа (403)");
        throw new Error(`API Error: ${response.statusText}`);
    }

    // Handle empty responses (common for DELETE)
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return null;
    }

    return response.json();
  }
};
