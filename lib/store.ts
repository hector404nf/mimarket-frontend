import { api, ApiResponse, ApiError } from './axios';

interface StoreData {
  nombre_tienda: string;
  descripcion: string;
  categoria_principal: string;
  direccion: string;
  telefono_contacto: string;
  email_contacto: string;
  sitio_web?: string;
  latitud?: number;
  longitud?: number;
}

interface StoreResponse {
  success: boolean;
  message: string;
  data?: any;
}

class StoreService {

  async createStore(storeData: StoreData): Promise<StoreResponse> {
    try {
      const response = await api.post<ApiResponse<any>>('/v1/tiendas', storeData);
      const data = response.data;

      return {
        success: data.success,
        message: data.message || 'Tienda creada exitosamente',
        data: data.data,
      };
    } catch (error: any) {
      console.error('Error creating store:', error);
      return {
        success: false,
        message: error.message || 'Error al crear la tienda',
      };
    }
  }

  async getStore(storeId: number): Promise<StoreResponse> {
    try {
      const response = await api.get<ApiResponse<any>>(`/v1/tiendas/${storeId}`);
      const data = response.data;

      return {
        success: data.success,
        message: data.message || 'Tienda obtenida exitosamente',
        data: data.data,
      };
    } catch (error: any) {
      console.error('Error getting store:', error);
      return {
        success: false,
        message: error.message || 'Error al obtener la tienda',
      };
    }
  }

  async updateStore(storeId: number, storeData: Partial<StoreData>): Promise<StoreResponse> {
    try {
      const response = await api.put<ApiResponse<any>>(`/v1/tiendas/${storeId}`, storeData);
      const data = response.data;

      return {
        success: data.success,
        message: data.message || 'Tienda actualizada exitosamente',
        data: data.data,
      };
    } catch (error: any) {
      console.error('Error updating store:', error);
      return {
        success: false,
        message: error.message || 'Error al actualizar la tienda',
      };
    }
  }

  async getUserStore(): Promise<StoreResponse> {
    try {
      // Nota: si necesitas la tienda del usuario, usa
      // `/v1/tiendas/usuario/{usuario}` según backend.
      const response = await api.get<ApiResponse<any>>('/v1/tiendas');
      const data = response.data;

      return {
        success: data.success,
        message: data.message || 'Tienda del usuario obtenida exitosamente',
        data: data.data,
      };
    } catch (error: any) {
      console.error('Error getting user store:', error);
      return {
        success: false,
        message: error.message || 'Error al obtener la tienda del usuario',
      };
    }
  }
}

export const storeService = new StoreService();
export type { StoreData, StoreResponse };