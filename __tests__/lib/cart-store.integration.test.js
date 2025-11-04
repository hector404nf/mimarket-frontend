/**
 * Tests de Integración - Cart Store
 * Verifica las operaciones del carrito con el backend
 */

import { renderHook, act } from '@testing-library/react';
import { useCart } from '../../lib/cart-store';
import { api } from '../../lib/axios';

// Mock de la API
jest.mock('../../lib/axios', () => ({
  api: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock del contexto de auth
jest.mock('../../contexts/auth-context', () => ({
  useAuth: () => ({
    user: { id: 1, name: 'Test User' },
    isAuthenticated: true,
  }),
}));

describe('Cart Store Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Limpiar el store antes de cada test
    const { result } = renderHook(() => useCart());
    act(() => {
      result.current.items = [];
      result.current.isLoading = false;
      result.current.error = null;
    });
  });

  describe('Load Cart', () => {
    test('should load cart items from backend', async () => {
      const mockUserResponse = {
        data: {
          data: {
            id: 1,
            email: 'test@example.com'
          }
        }
      };

      const mockCartResponse = {
        data: [
          {
            id_carrito: 1,
            id_producto: 101,
            cantidad: 2,
            precio_unitario: 25.99,
            producto: {
              id: 101,
              nombre: 'Producto Test',
              descripcion: 'Descripción del producto'
            }
          },
          {
            id_carrito: 2,
            id_producto: 102,
            cantidad: 1,
            precio_unitario: 15.50,
            producto: {
              id: 102,
              nombre: 'Otro Producto',
              descripcion: 'Otra descripción'
            }
          }
        ]
      };

      api.get
        .mockResolvedValueOnce(mockUserResponse)
        .mockResolvedValueOnce(mockCartResponse);

      const { result } = renderHook(() => useCart());

      await act(async () => {
        await result.current.loadCart();
      });

      expect(api.get).toHaveBeenCalledWith('/auth/me');
      expect(api.get).toHaveBeenCalledWith('/v1/carrito/usuario/1');
      expect(result.current.items).toHaveLength(2);
      expect(result.current.items[0].id_carrito).toBe(1);
      expect(result.current.items[0].cantidad).toBe(2);
      expect(result.current.items[1].id_carrito).toBe(2);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    test('should handle load cart error', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Error al cargar carrito'
          }
        }
      };

      api.get.mockRejectedValue(mockError);

      const { result } = renderHook(() => useCart());

      await act(async () => {
        await result.current.loadCart();
      });

      expect(result.current.items).toHaveLength(0);
      expect(result.current.error).toBe('Error al cargar carrito');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Add Item', () => {
    test('should add new item to cart', async () => {
      const mockUserResponse = {
        data: {
          data: { id: 1 }
        }
      };

      const mockProductResponse = {
        data: {
          precio: 29.99
        }
      };

      const mockAddResponse = {
        data: {
          id_carrito: 3,
          id_producto: 103,
          cantidad: 1,
          precio_unitario: 29.99
        }
      };

      api.get
        .mockResolvedValueOnce(mockUserResponse) // /auth/me
        .mockResolvedValueOnce(mockProductResponse); // /productos/103
      api.post.mockResolvedValue(mockAddResponse);

      const { result } = renderHook(() => useCart());

      await act(async () => {
        await result.current.addItem(103);
      });

      expect(api.get).toHaveBeenCalledWith('/auth/me');
      expect(api.get).toHaveBeenCalledWith('/productos/103');
      expect(api.post).toHaveBeenCalledWith('/carrito', {
        user_id: 1,
        id_producto: 103,
        cantidad: 1,
        precio_unitario: 29.99
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].id_carrito).toBe(3);
      expect(result.current.items[0].cantidad).toBe(1);
      expect(result.current.isLoading).toBe(false);
    });

    test('should update quantity if item already exists', async () => {
      const mockUserResponse = {
        data: {
          data: { id: 1 }
        }
      };

      const mockUpdateResponse = {
        data: {
          id_carrito: 1,
          id_producto: 101,
          cantidad: 3,
          precio_unitario: 25.99
        }
      };

      api.get.mockResolvedValue(mockUserResponse);
      api.put.mockResolvedValue(mockUpdateResponse);

      const { result } = renderHook(() => useCart());

      // Simular que ya hay un item en el carrito
      act(() => {
        result.current.items = [{
          id_carrito: 1,
          id_producto: 101,
          cantidad: 2,
          precio_unitario: 25.99
        }];
      });

      await act(async () => {
        await result.current.addItem(101, 1);
      });

      expect(api.put).toHaveBeenCalledWith('/carrito/1', {
        cantidad: 3
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].cantidad).toBe(3);
    });

    test('should handle add item error', async () => {
      const mockUserResponse = {
        data: {
          data: { id: 1 }
        }
      };

      const mockError = {
        response: {
          data: {
            message: 'Producto no disponible'
          }
        }
      };

      api.get.mockResolvedValue(mockUserResponse);
      api.post.mockRejectedValue(mockError);

      const { result } = renderHook(() => useCart());

      await act(async () => {
        await result.current.addItem(999);
      });

      expect(result.current.error).toBe('Producto no disponible');
      expect(result.current.items).toHaveLength(0);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Remove Item', () => {
    test('should remove item from cart', async () => {
      api.delete.mockResolvedValue({ data: { success: true } });

      const { result } = renderHook(() => useCart());

      // Simular items en el carrito
      act(() => {
        result.current.items = [
          {
            id_carrito: 1,
            id_producto: 101,
            cantidad: 2,
            precio_unitario: 25.99
          },
          {
            id_carrito: 2,
            id_producto: 102,
            cantidad: 1,
            precio_unitario: 15.50
          }
        ];
      });

      await act(async () => {
        await result.current.removeItem(1);
      });

      expect(api.delete).toHaveBeenCalledWith('/carrito/1');
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].id_carrito).toBe(2);
      expect(result.current.isLoading).toBe(false);
    });

    test('should handle remove item error', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Error al eliminar producto'
          }
        }
      };

      api.delete.mockRejectedValue(mockError);

      const { result } = renderHook(() => useCart());

      // Simular items en el carrito
      act(() => {
        result.current.items = [{
          id_carrito: 1,
          id_producto: 101,
          cantidad: 2,
          precio_unitario: 25.99
        }];
      });

      await act(async () => {
        await result.current.removeItem(1);
      });

      expect(result.current.error).toBe('Error al eliminar producto');
      expect(result.current.items).toHaveLength(1); // Item no se eliminó
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Update Quantity', () => {
    test('should update item quantity', async () => {
      const mockUpdateResponse = {
        data: {
          id_carrito: 1,
          id_producto: 101,
          cantidad: 5,
          precio_unitario: 25.99
        }
      };

      api.put.mockResolvedValue(mockUpdateResponse);

      const { result } = renderHook(() => useCart());

      // Simular item en el carrito
      act(() => {
        result.current.items = [{
          id_carrito: 1,
          id_producto: 101,
          cantidad: 2,
          precio_unitario: 25.99
        }];
      });

      await act(async () => {
        await result.current.updateQuantity(1, 5);
      });

      expect(api.put).toHaveBeenCalledWith('/carrito/1', {
        cantidad: 5
      });

      expect(result.current.items[0].cantidad).toBe(5);
      expect(result.current.isLoading).toBe(false);
    });

    test('should remove item when quantity is zero or negative', async () => {
      const { result } = renderHook(() => useCart());

      // Mock de la respuesta de eliminación
      api.delete.mockResolvedValue({
        data: { success: true, message: 'Item eliminado del carrito' }
      });

      // Simular item en el carrito
      act(() => {
        result.current.items = [{
          id_carrito: 1,
          id_producto: 101,
          cantidad: 2,
          precio_unitario: 25.99
        }];
      });

      await act(async () => {
        await result.current.updateQuantity(1, 0);
      });

      expect(api.delete).toHaveBeenCalledWith('/carrito/1');
      expect(result.current.items).toHaveLength(0);
      expect(result.current.isLoading).toBe(false);
    });

    test('should handle update quantity error', async () => {
      const mockError = {
        response: {
          data: {
            message: 'Error al actualizar cantidad'
          }
        }
      };

      api.put.mockRejectedValue(mockError);

      const { result } = renderHook(() => useCart());

      // Simular item en el carrito
      act(() => {
        result.current.items = [{
          id_carrito: 1,
          id_producto: 101,
          cantidad: 2,
          precio_unitario: 25.99
        }];
      });

      await act(async () => {
        await result.current.updateQuantity(1, 5);
      });

      expect(result.current.error).toBe('Error al actualizar cantidad');
      expect(result.current.items[0].cantidad).toBe(2); // Cantidad no cambió
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Clear Cart', () => {
    test('should clear all items from cart', async () => {
      api.delete.mockResolvedValue({ data: { success: true } });

      const { result } = renderHook(() => useCart());

      // Simular items en el carrito
      act(() => {
        result.current.items = [
          {
            id_carrito: 1,
            id_producto: 101,
            cantidad: 2,
            precio_unitario: 25.99
          },
          {
            id_carrito: 2,
            id_producto: 102,
            cantidad: 1,
            precio_unitario: 15.50
          }
        ];
      });

      await act(async () => {
        await result.current.clearCart();
      });

      expect(api.delete).toHaveBeenCalledWith('/v1/carrito/usuario/1/clear');
      expect(result.current.items).toHaveLength(0);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Cart Calculations', () => {
    test('should calculate total items correctly', () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.items = [
          {
            id_carrito: 1,
            id_producto: 101,
            cantidad: 2,
            precio_unitario: 25.99
          },
          {
            id_carrito: 2,
            id_producto: 102,
            cantidad: 3,
            precio_unitario: 15.50
          }
        ];
      });

      const totalItems = result.current.getTotalItems();
      expect(totalItems).toBe(5); // 2 + 3
    });

    test('should calculate total price correctly', () => {
      const { result } = renderHook(() => useCart());

      act(() => {
        result.current.items = [
          {
            id_carrito: 1,
            id_producto: 101,
            cantidad: 2,
            precio_unitario: 25.99
          },
          {
            id_carrito: 2,
            id_producto: 102,
            cantidad: 3,
            precio_unitario: 15.50
          }
        ];
      });

      const totalPrice = result.current.getTotalPrice();
      expect(totalPrice).toBeCloseTo(98.48, 2); // (2 * 25.99) + (3 * 15.50)
    });

    test('should return empty array when no items', () => {
      const { result } = renderHook(() => useCart());

      const products = result.current.getCartProducts();
      expect(products).toEqual([]);
      expect(result.current.getTotalItems()).toBe(0);
      expect(result.current.getTotalPrice()).toBe(0);
    });
  });
});