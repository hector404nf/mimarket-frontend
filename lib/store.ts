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
  banco_nombre?: string;
  banco_cuenta?: string;
  banco_titular?: string;
  banco_tipo?: string;
  logo?: string;
  banner?: string;
  logoFile?: File;
  bannerFile?: File;
  configuracion_tienda?: any;
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
      const hasFiles = !!storeData.logoFile || !!storeData.bannerFile;
      if (hasFiles) {
        const formData = new FormData();
        if (typeof storeData.nombre_tienda === 'string') formData.set('nombre_tienda', storeData.nombre_tienda);
        if (typeof storeData.descripcion === 'string') formData.set('descripcion', storeData.descripcion);
        if (typeof storeData.categoria_principal === 'string') formData.set('categoria_principal', storeData.categoria_principal);
        if (typeof storeData.direccion === 'string') formData.set('direccion', storeData.direccion);
        if (typeof storeData.telefono_contacto === 'string') formData.set('telefono_contacto', storeData.telefono_contacto);
        if (typeof storeData.email_contacto === 'string') formData.set('email_contacto', storeData.email_contacto);
        if (typeof storeData.sitio_web === 'string') formData.set('sitio_web', storeData.sitio_web);
        if (typeof storeData.latitud === 'number') formData.set('latitud', String(storeData.latitud));
        if (typeof storeData.longitud === 'number') formData.set('longitud', String(storeData.longitud));
        if (typeof storeData.banco_nombre === 'string') formData.set('banco_nombre', storeData.banco_nombre);
        if (typeof storeData.banco_cuenta === 'string') formData.set('banco_cuenta', storeData.banco_cuenta);
        if (typeof storeData.banco_titular === 'string') formData.set('banco_titular', storeData.banco_titular);
        if (typeof storeData.banco_tipo === 'string') formData.set('banco_tipo', storeData.banco_tipo);
        if (typeof storeData.logo === 'string') formData.set('logo', storeData.logo);
        if (typeof storeData.banner === 'string') formData.set('banner', storeData.banner);
        if (storeData.logoFile) formData.append('logo', storeData.logoFile);
        if (storeData.bannerFile) formData.append('banner', storeData.bannerFile);
        if (storeData.configuracion_tienda && typeof storeData.configuracion_tienda === 'object') {
          const appendNested = (prefix: string, value: any) => {
            if (Array.isArray(value)) {
              value.forEach((v, i) => appendNested(`${prefix}[${i}]`, v))
            } else if (value && typeof value === 'object') {
              Object.keys(value).forEach((key) => appendNested(`${prefix}[${key}]`, (value as any)[key]))
            } else if (value !== undefined && value !== null) {
              formData.set(prefix, String(value))
            }
          }
          appendNested('configuracion_tienda', storeData.configuracion_tienda)
        }
        formData.append('_method', 'PUT');
        const response = await api.upload<ApiResponse<any>>(`/v1/tiendas/${storeId}`, formData);
        const data = response.data;
        return {
          success: data.success,
          message: data.message || 'Tienda actualizada exitosamente',
          data: data.data,
        };
      } else {
        const response = await api.put<ApiResponse<any>>(`/v1/tiendas/${storeId}`, storeData);
        const data = response.data;
        return {
          success: data.success,
          message: data.message || 'Tienda actualizada exitosamente',
          data: data.data,
        };
      }
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

  async getHorarios(storeId: number) {
    const response = await api.get<ApiResponse<any>>(`/v1/tiendas/${storeId}/horarios`)
    return response.data.data || []
  }

  async updateHorarios(storeId: number, horarios: { dia_semana: string; hora_apertura?: string | null; hora_cierre?: string | null; cerrado?: boolean; notas_especiales?: string | null }[]) {
    const response = await api.put<ApiResponse<any>>(`/v1/tiendas/${storeId}/horarios`, { horarios })
    return response.data.data || []
  }

  async getDeliveryZones(storeId: number) {
    const response = await api.get<ApiResponse<any>>(`/v1/tiendas/${storeId}/zonas-delivery`)
    return response.data.data || []
  }

  async replaceDeliveryZones(storeId: number, zonas: { nombre: string; precio_envio: number; minutos_entrega: number; latitud: number; longitud: number; direccion_completa: string; zona_cobertura?: string; activo?: boolean }[]) {
    const response = await api.put<ApiResponse<any>>(`/v1/tiendas/${storeId}/zonas-delivery`, { zonas })
    return response.data.data || []
  }

  async getAcceptedPayments(storeId: number) {
    const response = await api.get<ApiResponse<any>>(`/v1/tiendas/${storeId}/metodos-pago`)
    return response.data.data || []
  }

  async setAcceptedPayments(storeId: number, metodos: string[]) {
    const response = await api.put<ApiResponse<any>>(`/v1/tiendas/${storeId}/metodos-pago`, { metodos })
    return response.data.data || []
  }
}

export const storeService = new StoreService();
export type { StoreData, StoreResponse };