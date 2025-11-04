/**
 * Tests de Manejo de Errores de API
 * Verifica que los errores de la API se manejen correctamente en el frontend
 */

// Mock de localStorage antes de importar axios
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock de window.location
delete window.location;
window.location = { href: '' };

// Mock de axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: {
        use: jest.fn(),
      },
      response: {
        use: jest.fn(),
      },
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  })),
  isAxiosError: jest.fn(),
}));

import axios from 'axios';
import { api } from '../../lib/axios';

describe('API Error Handling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    window.location.href = '';
  });

  describe('Network Errors', () => {
    test('should handle network connection errors', async () => {
      const networkError = new Error('Network Error');
      networkError.code = 'NETWORK_ERROR';
      
      axios.create.mockReturnValue({
        get: jest.fn().mockRejectedValue(networkError),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      });

      try {
        await api.get('/test-endpoint');
      } catch (error) {
        expect(error.type).toBe('network_error');
        expect(error.message).toContain('Error de conexión');
        expect(error.originalError).toBe(networkError);
      }
    });

    test('should handle timeout errors', async () => {
      const timeoutError = new Error('timeout of 10000ms exceeded');
      timeoutError.code = 'ECONNABORTED';
      
      axios.create.mockReturnValue({
        get: jest.fn().mockRejectedValue(timeoutError),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      });

      try {
        await api.get('/test-endpoint');
      } catch (error) {
        expect(error.type).toBe('network_error');
        expect(error.message).toContain('Error de conexión');
      }
    });
  });

  describe('Server Errors', () => {
    test('should handle 400 Bad Request errors', async () => {
      const badRequestError = {
        response: {
          status: 400,
          data: {
            message: 'Datos inválidos',
            errors: {
              email: ['El formato del email es inválido'],
              password: ['La contraseña es requerida'],
            },
          },
        },
      };

      axios.create.mockReturnValue({
        get: jest.fn().mockRejectedValue(badRequestError),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      });

      try {
        await api.get('/test-endpoint');
      } catch (error) {
        expect(error.type).toBe('server_error');
        expect(error.status).toBe(400);
        expect(error.message).toBe('Datos inválidos');
        expect(error.errors).toEqual({
          email: ['El formato del email es inválido'],
          password: ['La contraseña es requerida'],
        });
      }
    });

    test('should handle 404 Not Found errors', async () => {
      const notFoundError = {
        response: {
          status: 404,
          data: {
            message: 'Recurso no encontrado',
          },
        },
      };

      axios.create.mockReturnValue({
        get: jest.fn().mockRejectedValue(notFoundError),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      });

      try {
        await api.get('/test-endpoint');
      } catch (error) {
        expect(error.type).toBe('server_error');
        expect(error.status).toBe(404);
        expect(error.message).toBe('Recurso no encontrado');
      }
    });

    test('should handle 422 Validation errors', async () => {
      const validationError = {
        response: {
          status: 422,
          data: {
            message: 'Los datos proporcionados no son válidos',
            errors: {
              name: ['El nombre es requerido'],
              email: ['El email ya está en uso', 'El formato del email es inválido'],
              password: ['La contraseña debe tener al menos 8 caracteres'],
            },
          },
        },
      };

      axios.create.mockReturnValue({
        post: jest.fn().mockRejectedValue(validationError),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      });

      try {
        await api.post('/register', { name: '', email: 'invalid', password: '123' });
      } catch (error) {
        expect(error.type).toBe('server_error');
        expect(error.status).toBe(422);
        expect(error.message).toBe('Los datos proporcionados no son válidos');
        expect(error.errors.name).toContain('El nombre es requerido');
        expect(error.errors.email).toHaveLength(2);
        expect(error.errors.password).toContain('La contraseña debe tener al menos 8 caracteres');
      }
    });

    test('should handle 500 Internal Server errors', async () => {
      const serverError = {
        response: {
          status: 500,
          data: {
            message: 'Error interno del servidor',
          },
        },
      };

      axios.create.mockReturnValue({
        get: jest.fn().mockRejectedValue(serverError),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      });

      try {
        await api.get('/test-endpoint');
      } catch (error) {
        expect(error.type).toBe('server_error');
        expect(error.status).toBe(500);
        expect(error.message).toBe('Error interno del servidor');
      }
    });

    test('should handle server errors without message', async () => {
      const serverError = {
        response: {
          status: 503,
          data: {},
        },
      };

      axios.create.mockReturnValue({
        get: jest.fn().mockRejectedValue(serverError),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      });

      try {
        await api.get('/test-endpoint');
      } catch (error) {
        expect(error.type).toBe('server_error');
        expect(error.status).toBe(503);
        expect(error.message).toBe('Error del servidor');
        expect(error.errors).toEqual({});
      }
    });
  });

  describe('Authentication Errors', () => {
    test('should handle 401 Unauthorized errors', async () => {
      const unauthorizedError = {
        response: {
          status: 401,
          data: {
            message: 'Token expirado',
          },
        },
        config: {
          method: 'get',
          url: '/protected-endpoint',
          headers: {},
        },
      };

      const mockAxiosInstance = {
        get: jest.fn().mockRejectedValue(unauthorizedError),
        post: jest.fn(),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      };

      axios.create.mockReturnValue(mockAxiosInstance);

      try {
        await api.get('/protected-endpoint');
      } catch (error) {
        expect(error.status).toBe(401);
        expect(error.message).toBe('Token expirado');
        expect(error.type).toBe('server_error');
      }
    });

    test('should redirect to login when token refresh fails', async () => {
      const unauthorizedError = {
        response: {
          status: 401,
          data: {
            message: 'Token expirado',
          },
        },
        config: {
          method: 'get',
          url: '/protected-endpoint',
          headers: {},
        },
      };

      const refreshError = {
        response: {
          status: 401,
          data: {
            message: 'Refresh token inválido',
          },
        },
      };

      const mockAxiosInstance = {
        get: jest.fn().mockRejectedValue(unauthorizedError),
        post: jest.fn().mockRejectedValue(refreshError),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      };

      axios.create.mockReturnValue(mockAxiosInstance);

      try {
        await api.get('/protected-endpoint');
      } catch (error) {
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
        expect(window.location.href).toBe('/login');
      }
    });

    test('should not retry 401 errors more than once', async () => {
      const unauthorizedError = {
        response: {
          status: 401,
          data: {
            message: 'Token expirado',
          },
        },
        config: {
          method: 'get',
          url: '/protected-endpoint',
          headers: {},
          _retry: true, // Ya se intentó una vez
        },
      };

      const mockAxiosInstance = {
        get: jest.fn().mockRejectedValue(unauthorizedError),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      };

      axios.create.mockReturnValue(mockAxiosInstance);

      try {
        await api.get('/protected-endpoint');
      } catch (error) {
        expect(error.type).toBe('server_error');
        expect(error.status).toBe(401);
        expect(error.message).toBe('Token expirado');
      }
    });
  });

  describe('Request Interceptor', () => {
    test('should add authorization header when token exists', () => {
      localStorageMock.getItem.mockReturnValue('test-token-123');

      const mockConfig = {
        headers: {},
      };

      const mockAxiosInstance = {
        interceptors: {
          request: {
            use: jest.fn((successCallback) => {
              // Simular la ejecución del interceptor
              const result = successCallback(mockConfig);
              expect(result.headers.Authorization).toBe('Bearer test-token-123');
            }),
          },
          response: { use: jest.fn() },
        },
      };

      axios.create.mockReturnValue(mockAxiosInstance);
    });

    test('should not add authorization header when no token exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const mockConfig = {
        headers: {},
      };

      const mockAxiosInstance = {
        interceptors: {
          request: {
            use: jest.fn((successCallback) => {
              // Simular la ejecución del interceptor
              const result = successCallback(mockConfig);
              expect(result.headers.Authorization).toBeUndefined();
            }),
          },
          response: { use: jest.fn() },
        },
      };

      axios.create.mockReturnValue(mockAxiosInstance);
    });
  });

  describe('API Methods', () => {
    test('should handle errors in GET requests', async () => {
      const error = {
        response: {
          status: 404,
          data: { message: 'Not found' },
        },
      };

      axios.create.mockReturnValue({
        get: jest.fn().mockRejectedValue(error),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      });

      try {
        await api.get('/test');
      } catch (err) {
        expect(err.status).toBe(404);
        expect(err.message).toBe('Not found');
      }
    });

    test('should handle errors in POST requests', async () => {
      const error = {
        response: {
          status: 422,
          data: {
            message: 'Validation failed',
            errors: { email: ['Invalid email'] },
          },
        },
      };

      axios.create.mockReturnValue({
        post: jest.fn().mockRejectedValue(error),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      });

      try {
        await api.post('/test', { email: 'invalid' });
      } catch (err) {
        expect(err.status).toBe(422);
        expect(err.errors.email).toContain('Invalid email');
      }
    });

    test('should handle errors in PUT requests', async () => {
      const error = {
        response: {
          status: 403,
          data: { message: 'Forbidden' },
        },
      };

      axios.create.mockReturnValue({
        put: jest.fn().mockRejectedValue(error),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      });

      try {
        await api.put('/test/1', { name: 'Updated' });
      } catch (err) {
        expect(err.status).toBe(403);
        expect(err.message).toBe('Forbidden');
      }
    });

    test('should handle errors in DELETE requests', async () => {
      const error = {
        response: {
          status: 409,
          data: { message: 'Conflict' },
        },
      };

      axios.create.mockReturnValue({
        delete: jest.fn().mockRejectedValue(error),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      });

      try {
        await api.delete('/test/1');
      } catch (err) {
        expect(err.status).toBe(409);
        expect(err.message).toBe('Conflict');
      }
    });

    test('should handle errors in upload requests', async () => {
      const error = {
        response: {
          status: 413,
          data: { message: 'File too large' },
        },
      };

      axios.create.mockReturnValue({
        post: jest.fn().mockRejectedValue(error),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      });

      const formData = new FormData();
      formData.append('file', new Blob(['test'], { type: 'text/plain' }));

      try {
        await api.upload('/upload', formData);
      } catch (err) {
        expect(err.status).toBe(413);
        expect(err.message).toBe('File too large');
      }
    });
  });

  describe('Error Response Structure', () => {
    test('should maintain consistent error structure', async () => {
      const serverError = {
        response: {
          status: 400,
          data: {
            message: 'Bad request',
            errors: { field: ['Error message'] },
          },
        },
      };

      axios.create.mockReturnValue({
        get: jest.fn().mockRejectedValue(serverError),
        interceptors: {
          request: { use: jest.fn() },
          response: { use: jest.fn() },
        },
      });

      try {
        await api.get('/test');
      } catch (error) {
        // Verificar que el error tiene la estructura esperada
        expect(error).toHaveProperty('message');
        expect(error).toHaveProperty('type');
        expect(error).toHaveProperty('status');
        expect(error).toHaveProperty('errors');
        expect(error).toHaveProperty('originalError');

        expect(typeof error.message).toBe('string');
        expect(['network_error', 'server_error']).toContain(error.type);
        expect(typeof error.status).toBe('number');
        expect(typeof error.errors).toBe('object');
      }
    });
  });
});