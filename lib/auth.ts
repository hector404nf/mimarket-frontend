import { api, ApiResponse, ApiError } from './axios';

export interface User {
  id: number;
  name: string;
  apellido: string;
  email: string;
  telefono?: string;
  activo: boolean;
  onboarded: boolean;
  foto_perfil?: string;
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
  profile_type: 'none' | 'personal' | 'store';
  has_store: boolean;
  has_personal_profile: boolean;
  store_info?: {
    id: number;
    nombre: string;
    descripcion: string;
    categoria: string;
  };
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    access_token: string;
    token_type: string;
  };
  errors?: any;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  apellido: string;
  email: string;
  password: string;
  password_confirmation: string;
  telefono?: string;
}

class AuthService {

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await api.post<ApiResponse<{ user: User; access_token: string; token_type: string }>>('/auth/login', credentials);
      const data = response.data;

      if (data.success && data.data?.access_token) {
        localStorage.setItem('auth_token', data.data.access_token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
      }

      return {
        success: data.success,
        message: data.message,
        data: data.data,
        errors: data.errors,
      };
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Manejo de errores específicos de Axios
      if (error.type === 'network_error') {
        return {
          success: false,
          message: error.message,
        };
      }
      
      // Si es un error de respuesta de Axios, extraer el mensaje de la respuesta
      if (error.response?.data) {
        return {
          success: false,
          message: error.response.data.message || 'Error de conexión. Intenta nuevamente.',
          errors: error.response.data.errors,
        };
      }
      
      return {
        success: false,
        message: error.message || 'Error de conexión. Intenta nuevamente.',
        errors: error.errors,
      };
    }
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    try {
      const response = await api.post<ApiResponse<{ user: User; access_token: string; token_type: string }>>('/auth/register', userData);
      const data = response.data;

      if (data.success && data.data?.access_token) {
        localStorage.setItem('auth_token', data.data.access_token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
      }

      return {
        success: data.success,
        message: data.message,
        data: data.data,
        errors: data.errors,
      };
    } catch (error: any) {
      console.error('Register error:', error);
      
      // Manejo de errores específicos de Axios
      if (error.type === 'network_error') {
        return {
          success: false,
          message: error.message,
        };
      }
      
      // Si es un error de respuesta de Axios, extraer el mensaje de la respuesta
      if (error.response?.data) {
        return {
          success: false,
          message: error.response.data.message || 'Error de conexión. Intenta nuevamente.',
          errors: error.response.data.errors,
        };
      }
      
      return {
        success: false,
        message: error.message || 'Error de conexión. Intenta nuevamente.',
        errors: error.errors,
      };
    }
  }

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  }

  async me(): Promise<User | null> {
    try {
      const response = await api.get<ApiResponse<User>>('/auth/me');
      const data = response.data;

      if (data.success && data.data) {
        localStorage.setItem('user', JSON.stringify(data.data));
        return data.data;
      }

      return null;
    } catch (error: any) {
      // Solo mostrar error si no es un problema de autenticación (401)
      if (error?.response?.status !== 401) {
        console.error('Me error:', error);
      }
      // Si es 401, limpiar token inválido
      if (error?.response?.status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
      return null;
    }
  }

  async refreshToken(): Promise<boolean> {
    try {
      const response = await api.post<ApiResponse<{ access_token: string; token_type: string }>>('/auth/refresh');
      const data = response.data;

      if (data.success && data.data?.access_token) {
        localStorage.setItem('auth_token', data.data.access_token);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Refresh token error:', error);
      return false;
    }
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  getUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

export const authService = new AuthService();