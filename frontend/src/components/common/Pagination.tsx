// ===============================================
// PASO 9.25 - frontend/src/components/common/Pagination.tsx
// COMPONENTE PAGINACIÓN
// ===============================================

import React from 'react';
import clsx from 'clsx';

// ===============================================
// TIPOS Y INTERFACES
// ===============================================
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange?: (itemsPerPage: number) => void;
  showPageSizeSelector?: boolean;
  pageSizeOptions?: number[];
  className?: string;
}

// ===============================================
// COMPONENTE PRINCIPAL
// ===============================================
const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  showPageSizeSelector = true,
  pageSizeOptions = [10, 20, 50, 100],
  className,
}) => {
  // ===============================================
  // CALCULAR RANGO DE ELEMENTOS
  // ===============================================
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // ===============================================
  // GENERAR NÚMEROS DE PÁGINA
  // ===============================================
  const generatePageNumbers = () => {
    const delta = 2; // Número de páginas a mostrar a cada lado de la actual
    const range = [];
    const rangeWithDots = [];

    for (
      let i = Math.max(2, currentPage - delta);
      i <= Math.min(totalPages - 1, currentPage + delta);
      i++
    ) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  // ===============================================
  // MANEJADORES
  // ===============================================
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    if (onItemsPerPageChange) {
      onItemsPerPageChange(newItemsPerPage);
    }
  };

  // ===============================================
  // CLASES PARA BOTONES
  // ===============================================
  const baseButtonClasses = [
    'relative',
    'inline-flex',
    'items-center',
    'px-3',
    'py-2',
    'text-sm',
    'font-medium',
    'border',
    'transition-colors',
    'duration-200',
  ];

  const activeButtonClasses = [
    ...baseButtonClasses,
    'z-10',
    'bg-primary-50',
    'border-primary-500',
    'text-primary-600',
  ];

  const inactiveButtonClasses = [
    ...baseButtonClasses,
    'bg-white',
    'border-gray-300',
    'text-gray-500',
    'hover:bg-gray-50',
    'hover:text-gray-700',
  ];

  const disabledButtonClasses = [
    ...baseButtonClasses,
    'bg-white',
    'border-gray-300',
    'text-gray-300',
    'cursor-not-allowed',
  ];

  // ===============================================
  // RENDER
  // ===============================================
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={clsx('flex items-center justify-between', className)}>
      {/* Información de elementos */}
      <div className="flex-1 flex justify-between sm:hidden">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className={clsx(
            'relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md',
            currentPage <= 1 ? disabledButtonClasses : inactiveButtonClasses
          )}
        >
          Anterior
        </button>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className={clsx(
            'ml-3 relative inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md',
            currentPage >= totalPages ? disabledButtonClasses : inactiveButtonClasses
          )}
        >
          Siguiente
        </button>
      </div>

      <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          {/* Información de elementos */}
          <p className="text-sm text-gray-700">
            Mostrando <span className="font-medium">{startItem}</span> a{' '}
            <span className="font-medium">{endItem}</span> de{' '}
            <span className="font-medium">{totalItems}</span> resultados
          </p>

          {/* Selector de elementos por página */}
          {showPageSizeSelector && onItemsPerPageChange && (
            <div className="flex items-center gap-2">
              <label htmlFor="pageSize" className="text-sm text-gray-700">
                Por página:
              </label>
              <select
                id="pageSize"
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {pageSizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Navegación de páginas */}
        <div>
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            {/* Botón Anterior */}
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage <= 1}
              className={clsx(
                'rounded-l-md',
                currentPage <= 1 ? disabledButtonClasses : inactiveButtonClasses
              )}
            >
              <span className="sr-only">Anterior</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Números de página */}
            {generatePageNumbers().map((page, index) => {
              if (page === '...') {
                return (
                  <span
                    key={`dots-${index}`}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                  >
                    ...
                  </span>
                );
              }

              const pageNumber = page as number;
              const isActive = pageNumber === currentPage;

              return (
                <button
                  key={pageNumber}
                  onClick={() => handlePageChange(pageNumber)}
                  className={clsx(
                    isActive ? activeButtonClasses : inactiveButtonClasses
                  )}
                >
                  {pageNumber}
                </button>
              );
            })}

            {/* Botón Siguiente */}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className={clsx(
                'rounded-r-md',
                currentPage >= totalPages ? disabledButtonClasses : inactiveButtonClasses
              )}
            >
              <span className="sr-only">Siguiente</span>
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Pagination;