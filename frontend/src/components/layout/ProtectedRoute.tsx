// ===============================================
// PASO 9.8 - frontend/src/components/layout/ProtectedRoute.tsx
// COMPONENTE RUTA PROTEGIDA
// ===============================================

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../common/LoadingSpinner';

// ===============================================
// TIPOS Y INTERFACES
// ===============================================
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user';
}

// ===============================================
// COMPONENTE PRINCIPAL
// ===============================================
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // ===============================================
  // MOSTRAR LOADING MIENTRAS SE VERIFICA AUTH
  // ===============================================
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner
          size="lg"
          text="Verificando autenticación..."
          centered
        />
      </div>
    );
  }

  // ===============================================
  // REDIRIGIR A LOGIN SI NO ESTÁ AUTENTICADO
  // ===============================================
  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location }}
        replace
      />
    );
  }

  // ===============================================
  // VERIFICAR PERMISOS DE ROLE SI ES REQUERIDO
  // ===============================================
  if (requiredRole && user?.role !== requiredRole && user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-soft rounded-xl p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-danger-100 mb-4">
            <svg
              className="h-6 w-6 text-danger-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Acceso Denegado
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            No tienes permisos suficientes para acceder a esta página.
          </p>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  // ===============================================
  // RENDERIZAR CHILDREN SI TODO ESTÁ OK
  // ===============================================
  return <>{children}</>;
};

export default ProtectedRoute;