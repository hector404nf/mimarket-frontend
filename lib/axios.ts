import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// Configuración base de la API (dinámica)
// - Si NEXT_PUBLIC_API_URL está definido, se usará ese origen y se añadirá
//   el prefijo "/api" SOLO si no termina ya en "/api".
// - Si no está definido, se usa el proxy local "/api" de next.config.mjs.
const rawBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, '');
const API_BASE_URL = rawBase
  ? (rawBase.endsWith('/api') ? rawBase : `${rawBase}/api`)
  : '/api';

// Crear instancia de Axios
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 segundos para evitar abortos prematuros en endpoints lentos
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // Para Laravel Sanctum
});

// ---- Deduplicación de solicitudes GET (single-flight) ----
// Evita disparar múltiples peticiones idénticas en paralelo (común en Strict Mode y remounts)
const inflightGet = new Map<string, Promise<AxiosResponse<any>>>();

function stableStringifyParams(params: any): string {
  if (!params || typeof params !== 'object') return '';
  const keys = Object.keys(params).sort();
  const parts: string[] = [];
  for (const k of keys) {
    const v = (params as any)[k];
    const sv = typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v);
    parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(sv)}`);
  }
  return parts.join('&');
}

function buildGetKey(url: string, config?: AxiosRequestConfig): string {
  const method = 'GET';
  const paramsStr = stableStringifyParams(config?.params);
  // Incluir baseURL para diferenciar instancias, y el token para aislar sesión
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : '';
  return `${method}:${API_BASE_URL}${url}?${paramsStr}|auth=${token}`;
}

// Interceptor de request - agregar token automáticamente
apiClient.interceptors.request.use(
  (config: AxiosRequestConfig): any => {
    const token = localStorage.getItem('auth_token');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log de la petición en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        data: config.data,
      });
    }
    
    return config;
  },
  (error: AxiosError) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Interceptor de response - manejo de errores y tokens
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log de la respuesta en desarrollo
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, {
        status: response.status,
        data: response.data,
      });
    }
    
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };
    
    // Si la respuesta falla, asegurarnos de limpiar la entrada inflight del GET correspondiente
    try {
      if (originalRequest?.method?.toUpperCase() === 'GET' && originalRequest.url) {
        const key = buildGetKey(originalRequest.url, originalRequest);
        inflightGet.delete(key);
      }
    } catch {}
    
    // Log del error en desarrollo (excepto 401 para /auth/me que es normal)
    if (process.env.NODE_ENV === 'development') {
      const isAuthMeRequest = originalRequest?.url?.includes('/auth/me');
      const is401Error = error.response?.status === 401;
      
      if (!(isAuthMeRequest && is401Error)) {
        console.error(`❌ ${error.response?.status} ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`, {
          error: error.response?.data,
          status: error.response?.status,
        });
      }
    }
    
    // Manejo de errores 401 (no autorizado)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // No intentar refresh para rutas de auth/me sin token
      const isAuthMeRequest = originalRequest?.url?.includes('/auth/me');
      if (isAuthMeRequest && !localStorage.getItem('auth_token')) {
        return Promise.reject(error);
      }
      
      // Intentar refrescar el token (single-flight para evitar múltiples refresh concurrentes)
      try {
        let refreshPromise: Promise<AxiosResponse<any>>;
        const REFRESH_KEY = '___refresh_inflight';
        const existing = (apiClient as any)[REFRESH_KEY] as Promise<AxiosResponse<any>> | undefined;
        if (existing) {
          refreshPromise = existing;
        } else {
          refreshPromise = apiClient.post('/auth/refresh');
          (apiClient as any)[REFRESH_KEY] = refreshPromise;
        }

        const refreshResponse = await refreshPromise.finally(() => {
          // Limpiar bandera
          delete (apiClient as any)[REFRESH_KEY];
        });

        const newToken = (refreshResponse as any).data?.data?.access_token;
        
        if (newToken) {
          localStorage.setItem('auth_token', newToken);
          
          // Reintentar la petición original con el nuevo token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Si el refresh falla, limpiar el localStorage y redirigir al login
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        
        // Redirigir al login (solo en el cliente)
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }
    
    // Manejo de errores de red
    if (!error.response) {
      console.error('❌ Network Error:', error.message);
      return Promise.reject({
        message: 'Error de conexión. Verifica tu conexión a internet.',
        type: 'network_error',
        originalError: error,
      });
    }
    
    // Manejo de errores del servidor
    const errorData = error.response.data as any;
    return Promise.reject({
      message: errorData?.message || 'Error del servidor',
      errors: errorData?.errors || {},
      status: error.response.status,
      type: 'server_error',
      originalError: error,
    });
  }
);

// Funciones helper para diferentes tipos de peticiones
export const api = {
  // GET request
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    const key = buildGetKey(url, config);
    const existing = inflightGet.get(key);
    if (existing) return existing as Promise<AxiosResponse<T>>;

    const req = apiClient.get<T>(url, config)
      .finally(() => {
        inflightGet.delete(key);
      });
    inflightGet.set(key, req as Promise<AxiosResponse<any>>);
    return req as Promise<AxiosResponse<T>>;
  },
  
  // POST request
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.post(url, data, config);
  },
  
  // PUT request
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.put(url, data, config);
  },
  
  // PATCH request
  patch: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.patch(url, data, config);
  },
  
  // DELETE request
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.delete(url, config);
  },
  
  // Upload de archivos (FormData)
  upload: <T = any>(url: string, formData: FormData, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> => {
    return apiClient.post(url, formData, {
      ...config,
      headers: {
        ...config?.headers,
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Exportar la instancia de Axios para casos especiales
export default apiClient;

// Tipos para las respuestas de la API
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
  type: 'network_error' | 'server_error';
  originalError: any;
}