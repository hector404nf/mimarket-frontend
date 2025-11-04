"use client";

import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  requireOnboarding = true 
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated, isOnboarded } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      // Si no está autenticado, redirigir al login
      if (!isAuthenticated) {
        router.push('/login');
        return;
      }

      // Si requiere onboarding y no lo ha completado, redirigir a onboarding
      if (requireOnboarding && !isOnboarded) {
        router.push('/onboarding');
        return;
      }
    }
  }, [isLoading, isAuthenticated, isOnboarded, requireOnboarding, router]);

  // Mostrar loading mientras se verifica
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado o no ha completado onboarding, no mostrar contenido
  if (!isAuthenticated || (requireOnboarding && !isOnboarded)) {
    return null;
  }

  return <>{children}</>;
}