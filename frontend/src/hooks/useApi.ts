// ===============================================
// PASO 9.10 - frontend/src/hooks/useApi.ts
// CUSTOM HOOK PARA LLAMADAS A LA API
// ===============================================

import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

// ===============================================
// TIPOS Y INTERFACES
// ===============================================
interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

// ===============================================
// HOOK PRINCIPAL
// ===============================================
export const useApi = <T = any>(
  apiFunction: (...args: any[]) => Promise<T>,
  options: {
    showSuccessToast?: boolean;
    showErrorToast?: boolean;
    successMessage?: string;
  } = {}
): UseApiReturn<T> => {
  const {
    showSuccessToast = false,
    showErrorToast = true,
    successMessage = 'Operación exitosa',
  } = options;

  // ===============================================
  // ESTADO
  // ===============================================
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  // ===============================================
  // EJECUTAR FUNCIÓN DE API
  // ===============================================
  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        const result = await apiFunction(...args);
        
        setState(prev => ({ ...prev, data: result, loading: false }));
        
        if (showSuccessToast) {
          toast.success(successMessage);
        }
        
        return result;
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 
                           error.message || 
                           'Ha ocurrido un error';
        
        setState(prev => ({ 
          ...prev, 
          error: errorMessage, 
          loading: false 
        }));
        
        if (showErrorToast) {
          toast.error(errorMessage);
        }
        
        return null;
      }
    },
    [apiFunction, showSuccessToast, showErrorToast, successMessage]
  );

  // ===============================================
  // RESETEAR ESTADO
  // ===============================================
  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
};