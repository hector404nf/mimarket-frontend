/**
 * @jest-environment jsdom
 */

import { jest } from '@jest/globals';
import { authService } from '../../lib/auth';
import { api } from '../../lib/axios';

// Mock de console.error para evitar logs en tests
// global.console.error = jest.fn();

describe('Auth Integration Tests', () => {
  // Simple localStorage mock
  let mockStorage = {};
  
  beforeAll(() => {
    // Mock localStorage completely
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn((key) => mockStorage[key] || null),
        setItem: jest.fn((key, value) => {
          mockStorage[key] = value;
        }),
        removeItem: jest.fn((key) => {
          delete mockStorage[key];
        }),
        clear: jest.fn(() => {
          mockStorage = {};
        }),
        length: 0,
        key: jest.fn()
      },
      writable: true
    });
  });

  const mockUser = {
    id: 1,
    name: 'Test',
    apellido: 'User',
    email: 'test@example.com',
    activo: true,
    onboarded: true,
    profile_type: 'personal',
    has_store: false,
    has_personal_profile: true,
    created_at: '2024-01-01T00:00:00.000Z',
    updated_at: '2024-01-01T00:00:00.000Z'
  };

  const mockCredentials = {
    email: 'test@example.com',
    password: 'password123'
  };

  beforeEach(() => {
    // Clear mock storage
    mockStorage = {};
    
    // Reset API mocks
    if (api.post && typeof api.post.mockClear === 'function') {
      api.post.mockClear();
    }
    if (api.get && typeof api.get.mockClear === 'function') {
      api.get.mockClear();
    }
    
    // Clear localStorage mock calls
    localStorage.getItem.mockClear();
    localStorage.setItem.mockClear();
    localStorage.removeItem.mockClear();
    localStorage.clear.mockClear();
  });

  describe('API Integration', () => {
    test('should connect to API successfully', async () => {
      const apiSpy = jest.spyOn(api, 'post').mockResolvedValue({
        data: {
          success: true,
          message: 'Login successful',
          data: {
            user: mockUser,
            access_token: 'test-token',
            token_type: 'Bearer'
          }
        }
      });

      const result = await authService.login(mockCredentials);

      expect(result.success).toBe(true);
      expect(apiSpy).toHaveBeenCalledWith('/auth/login', mockCredentials);
      apiSpy.mockRestore();
    });
  });

  describe('Login Integration', () => {
    test('should handle successful login', async () => {
      const mockLoginResponse = {
        data: {
          success: true,
          message: 'Login exitoso',
          data: {
            user: mockUser,
            access_token: 'token-123',
            token_type: 'Bearer'
          }
        }
      };

      const apiSpy = jest.spyOn(api, 'post').mockResolvedValue(mockLoginResponse);

      const result = await authService.login(mockCredentials);

      expect(result.success).toBe(true);
      expect(result.data?.user.email).toBe('test@example.com');
      expect(result.data?.access_token).toBe('token-123');
      expect(apiSpy).toHaveBeenCalledWith('/auth/login', mockCredentials);
      apiSpy.mockRestore();
    });

    test('should handle login errors', async () => {
      const loginError = {
        response: {
          data: {
            success: false,
            message: 'Credenciales inválidas',
            errors: {
              email: ['El email es incorrecto']
            }
          }
        }
      };

      const apiSpy = jest.spyOn(api, 'post').mockRejectedValue(loginError);

      const result = await authService.login(mockCredentials);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Credenciales inválidas');
      expect(apiSpy).toHaveBeenCalledWith('/auth/login', mockCredentials);
      apiSpy.mockRestore();
    });

    test('should handle network errors during login', async () => {
      const networkError = {
        type: 'network_error',
        message: 'Error de conexión'
      };

      const apiSpy = jest.spyOn(api, 'post').mockRejectedValue(networkError);

      const result = await authService.login(mockCredentials);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Error de conexión');
      apiSpy.mockRestore();
    });
  });

  describe('Registration Integration', () => {
    test('should handle successful registration', async () => {
      const mockRegisterResponse = {
        data: {
          success: true,
          message: 'Registration successful',
          data: {
            user: {
              id: 2,
              name: 'Nuevo',
              apellido: 'Usuario',
              email: 'nuevo@example.com',
              activo: true,
              onboarded: false,
              profile_type: 'none',
              has_store: false,
              has_personal_profile: false,
              created_at: '2024-01-01T00:00:00.000Z',
              updated_at: '2024-01-01T00:00:00.000Z'
            },
            access_token: 'new-token-456',
            token_type: 'Bearer'
          }
        }
      };

      const apiSpy = jest.spyOn(api, 'post').mockResolvedValue(mockRegisterResponse);

      const userData = {
        name: 'Nuevo',
        apellido: 'Usuario',
        email: 'nuevo@example.com',
        password: 'password123',
        password_confirmation: 'password123',
        telefono: '1234567890'
      };

      const result = await authService.register(userData);

      expect(result.success).toBe(true);
      expect(result.data?.user.email).toBe('nuevo@example.com');
      expect(result.data?.access_token).toBe('new-token-456');
      expect(apiSpy).toHaveBeenCalledWith('/auth/register', userData);
      apiSpy.mockRestore();
    });

    test('should handle registration validation errors', async () => {
      const mockValidationError = {
        response: {
          data: {
            success: false,
            message: 'Error de validación',
            errors: {
              email: ['El email ya está en uso'],
              password: ['La contraseña debe tener al menos 8 caracteres']
            }
          }
        }
      };

      const apiSpy = jest.spyOn(api, 'post').mockRejectedValue(mockValidationError);

      const userData = {
        name: 'Test',
        apellido: 'User',
        email: 'existing@example.com',
        password: '123',
        password_confirmation: '123'
      };

      const result = await authService.register(userData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Error de validación');
      expect(result.errors).toBeDefined();
      apiSpy.mockRestore();
    });
  });

  describe('Token Management', () => {
    test('should handle logout API call', async () => {
      const apiSpy = jest.spyOn(api, 'post').mockResolvedValue({
        data: { success: true }
      });

      await authService.logout();

      expect(apiSpy).toHaveBeenCalledWith('/auth/logout');
      apiSpy.mockRestore();
    });

    test('should handle logout even when API fails', async () => {
      const logoutError = new Error('Network error');
      const apiSpy = jest.spyOn(api, 'post').mockRejectedValue(logoutError);

      // No debería lanzar error
      await expect(authService.logout()).resolves.toBeUndefined();

      expect(apiSpy).toHaveBeenCalledWith('/auth/logout');
      apiSpy.mockRestore();
    });
  });

  describe('User Profile Integration', () => {
    test('should fetch user profile successfully', async () => {
      const mockUserResponse = {
        data: {
          success: true,
          data: {
            id: 1,
            name: 'Current',
            apellido: 'User',
            email: 'current@example.com',
            activo: true,
            onboarded: true,
            profile_type: 'store',
            has_store: true,
            has_personal_profile: false,
            created_at: '2024-01-01T00:00:00.000Z',
            updated_at: '2024-01-01T00:00:00.000Z',
            store_info: {
              id: 1,
              nombre: 'Mi Tienda',
              descripcion: 'Descripción de mi tienda',
              categoria: 'Electrónicos'
            }
          }
        }
      };

      const apiSpy = jest.spyOn(api, 'get').mockResolvedValue(mockUserResponse);

      const user = await authService.me();

      expect(user).toBeTruthy();
      expect(user?.email).toBe('current@example.com');
      expect(user?.has_store).toBe(true);
      expect(user?.store_info?.nombre).toBe('Mi Tienda');
      expect(apiSpy).toHaveBeenCalledWith('/auth/me');
      apiSpy.mockRestore();
      
      // Limpiar datos de localStorage después del test para evitar interferencia
      mockStorage = {};
    });

    test('should handle unauthorized access to profile', async () => {
      const unauthorizedError = {
        response: {
          status: 401,
          data: {
            success: false,
            message: 'No autorizado'
          }
        }
      };

      const apiSpy = jest.spyOn(api, 'get').mockRejectedValue(unauthorizedError);

      const user = await authService.me();

      expect(user).toBeNull();
      expect(apiSpy).toHaveBeenCalledWith('/auth/me');
      apiSpy.mockRestore();
    });
  });

  describe('Token Utilities', () => {
    test('should check authentication status', () => {
      // Mock token presente
      mockStorage['auth_token'] = 'valid-token';
      expect(authService.isAuthenticated()).toBe(true);

      // Mock sin token
      delete mockStorage['auth_token'];
      expect(authService.isAuthenticated()).toBe(false);
    });

    test('should get stored token', () => {
      const testToken = 'stored-test-token';
      
      // Configurar token directamente en el mock storage
      mockStorage['auth_token'] = testToken;

      const token = authService.getToken();
      expect(token).toBe(testToken);
      // Verificar que el mock fue llamado con la clave correcta
      expect(localStorage.getItem).toHaveBeenCalledWith('auth_token');
    });

    test('should get stored user', () => {
      const testUserData = {
        id: 1,
        name: 'Stored',
        apellido: 'User',
        email: 'stored@example.com',
        activo: true,
        onboarded: true,
        profile_type: 'personal',
        has_store: false,
        has_personal_profile: true,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      };
      
      // Set up data in localStorage
      mockStorage['user'] = JSON.stringify(testUserData);
      
      // Call the service
      const user = authService.getUser();
      
      // Verify the result
      expect(user).toEqual(testUserData);
      // Verify localStorage was called correctly
      expect(localStorage.getItem).toHaveBeenCalledWith('user');
    });
  });
});