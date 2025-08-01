// ===============================================
// PASO 9.11 - frontend/src/hooks/usePagination.ts
// CUSTOM HOOK PARA PAGINACIÓN
// ===============================================

import { useState, useCallback, useMemo } from 'react';

// ===============================================
// TIPOS Y INTERFACES
// ===============================================
interface PaginationOptions {
  initialPage?: number;
  initialLimit?: number;
  defaultLimit?: number;
}

interface PaginationState {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

interface PaginationReturn extends PaginationState {
  hasNext: boolean;
  hasPrevious: boolean;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  setTotalItems: (total: number) => void;
  reset: () => void;
  getOffset: () => number;
}

// ===============================================
// HOOK PRINCIPAL
// ===============================================
export const usePagination = (
  options: PaginationOptions = {}
): PaginationReturn => {
  const {
    initialPage = 1,
    initialLimit = 20,
    defaultLimit = 20,
  } = options;

  // ===============================================
  // ESTADO
  // ===============================================
  const [state, setState] = useState<PaginationState>({
    page: initialPage,
    limit: initialLimit,
    totalItems: 0,
    totalPages: 0,
  });

  // ===============================================
  // VALORES CALCULADOS
  // ===============================================
  const hasNext = useMemo(() => state.page < state.totalPages, [state.page, state.totalPages]);
  const hasPrevious = useMemo(() => state.page > 1, [state.page]);

  // ===============================================
  // FUNCIONES
  // ===============================================
  const setPage = useCallback((page: number) => {
    setState(prev => ({
      ...prev,
      page: Math.max(1, Math.min(page, prev.totalPages || 1)),
    }));
  }, []);

  const setLimit = useCallback((limit: number) => {
    setState(prev => {
      const newTotalPages = Math.ceil(prev.totalItems / limit);
      return {
        ...prev,
        limit,
        totalPages: newTotalPages,
        page: Math.min(prev.page, newTotalPages || 1),
      };
    });
  }, []);

  const nextPage = useCallback(() => {
    if (hasNext) {
      setPage(state.page + 1);
    }
  }, [hasNext, state.page, setPage]);

  const previousPage = useCallback(() => {
    if (hasPrevious) {
      setPage(state.page - 1);
    }
  }, [hasPrevious, state.page, setPage]);

  const firstPage = useCallback(() => {
    setPage(1);
  }, [setPage]);

  const lastPage = useCallback(() => {
    setPage(state.totalPages);
  }, [state.totalPages, setPage]);

  const setTotalItems = useCallback((total: number) => {
    setState(prev => {
      const newTotalPages = Math.ceil(total / prev.limit);
      return {
        ...prev,
        totalItems: total,
        totalPages: newTotalPages,
        page: Math.min(prev.page, newTotalPages || 1),
      };
    });
  }, []);

  const reset = useCallback(() => {
    setState({
      page: initialPage,
      limit: defaultLimit,
      totalItems: 0,
      totalPages: 0,
    });
  }, [initialPage, defaultLimit]);

  const getOffset = useCallback(() => {
    return (state.page - 1) * state.limit;
  }, [state.page, state.limit]);

  return {
    ...state,
    hasNext,
    hasPrevious,
    setPage,
    setLimit,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    setTotalItems,
    reset,
    getOffset,
  };
};