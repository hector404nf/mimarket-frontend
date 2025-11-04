"use client";

import { useAuth } from '@/contexts/auth-context';

export type ProfileType = 'none' | 'personal' | 'store';

export interface ProfileInfo {
  type: ProfileType;
  hasStore: boolean;
  hasPersonalProfile: boolean;
  storeInfo?: {
    id: number;
    nombre: string;
    descripcion: string;
    categoria: string;
  };
  isStoreOwner: boolean;
  isPersonalUser: boolean;
  needsOnboarding: boolean;
}

/**
 * Hook personalizado para manejar el tipo de perfil del usuario
 * Proporciona información sobre si el usuario tiene perfil personal, tienda, o ninguno
 */
export function useProfileType(): ProfileInfo {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return {
      type: 'none',
      hasStore: false,
      hasPersonalProfile: false,
      isStoreOwner: false,
      isPersonalUser: false,
      needsOnboarding: true,
    };
  }

  const type = user.profile_type || 'none';
  const hasStore = user.has_store || false;
  const hasPersonalProfile = user.has_personal_profile || false;
  const isStoreOwner = type === 'store';
  const isPersonalUser = type === 'personal';
  const needsOnboarding = type === 'none' || !user.onboarded;

  return {
    type,
    hasStore,
    hasPersonalProfile,
    storeInfo: user.store_info,
    isStoreOwner,
    isPersonalUser,
    needsOnboarding,
  };
}

/**
 * Hook para verificar si el usuario puede acceder a funciones de tienda
 */
export function useStoreAccess() {
  const { isStoreOwner, hasStore } = useProfileType();
  
  return {
    canAccessStoreDashboard: isStoreOwner && hasStore,
    canCreateProducts: isStoreOwner && hasStore,
    canManageOrders: isStoreOwner && hasStore,
    canViewStoreAnalytics: isStoreOwner && hasStore,
  };
}

/**
 * Hook para obtener rutas de redirección basadas en el tipo de perfil
 */
export function useProfileRoutes() {
  const { type, needsOnboarding } = useProfileType();
  
  const getDefaultRoute = () => {
    if (needsOnboarding) return '/onboarding';
    
    switch (type) {
      case 'store':
        return '/dashboard-tienda';
      case 'personal':
        return '/';
      default:
        return '/onboarding';
    }
  };

  const getDashboardRoute = () => {
    switch (type) {
      case 'store':
        return '/dashboard-tienda';
      case 'personal':
        return '/perfil';
      default:
        return '/onboarding';
    }
  };

  return {
    defaultRoute: getDefaultRoute(),
    dashboardRoute: getDashboardRoute(),
    needsOnboarding,
  };
}