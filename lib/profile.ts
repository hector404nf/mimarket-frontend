import { api, ApiResponse, ApiError } from './axios';

export interface ProfileData {
  biografia?: string;
  direccion?: string;
  ciudad?: string;
  codigo_postal?: string;
  pais?: string;
  preferencias_notificacion?: boolean;
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  data?: ProfileData;
  errors?: any;
}

class ProfileService {

  async createOrUpdateProfile(profileData: ProfileData): Promise<ProfileResponse> {
    try {
      const response = await api.post<ProfileResponse>('/perfil/setup', profileData);
      return response.data;
    } catch (error) {
      console.error('Profile setup error:', error);
      return {
        success: false,
        message: 'Error de conexión. Intenta nuevamente.',
      };
    }
  }

  async completeOnboarding(profileData: ProfileData): Promise<ProfileResponse> {
    try {
      const response = await api.post<ProfileResponse>('/perfil/complete-onboarding', profileData);
      return response.data;
    } catch (error) {
      console.error('Onboarding completion error:', error);
      return {
        errors: ['Error de conexión. Intenta nuevamente.'],
        message: error instanceof Error ? error.message : 'Error de conexión. Intenta nuevamente.',
      };
    }
  }

  async getProfile(userId: number): Promise<ProfileResponse> {
    try {
      const response = await api.get<ProfileResponse>(`/perfiles/usuario/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Get profile error:', error);
      return {
        success: false,
        message: 'Error al obtener el perfil.',
      };
    }
  }
}

export const profileService = new ProfileService();