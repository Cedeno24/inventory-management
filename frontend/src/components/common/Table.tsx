// ===============================================
// PASO 9.24 - frontend/src/components/common/Table.tsx
// COMPONENTE TABLA REUTILIZABLE
// ===============================================

import React from 'react';
import clsx from 'clsx';
import LoadingSpinner from './LoadingSpinner';

// ===============================================
// TIPOS Y INTERFACES
// ===============================================
export interface Column<T = any> {
  key: string;
  title: string;
  dataIndex?: keyof T;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  className?: string;
}

interface TableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyText?: string;
  rowKey?: keyof T | ((record: T) => string | number);
  onRowClick?: (record: T, index: number) => void;
  className?: string;
  striped?: boolean;
  hover?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

// ===============================================
// COMPONENTE PRINCIPAL
// ===============================================
function Table<T = any>({
  columns,
  data,
  loading = false,
  emptyText = 'No hay datos disponibles',
  rowKey = 'id' as keyof T,
  onRowClick,
  className,
  striped = false,
  hover = true,
  size = 'md',
}: TableProps<T>) {
  // ===============================================
  // FUNCIÓN PARA OBTENER KEY DE FILA
  // ===============================================
  const getRowKey = (record: T, index: number): string | number => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }
    return (record as any)[rowKey] || index;
  };

  // ===============================================
  // FUNCIÓN PARA OBTENER VALOR DE CELDA
  // ===============================================
  const getCellValue = (column: Column<T>, record: T, index: number) => {
    if (column.render) {
      const value = column.dataIndex ? (record as any)[column.dataIndex] : record;
      return column.render(value, record, index);
    }
    
    if (column.dataIndex) {
      return (record as any)[column.dataIndex];
    }
    
    return '';
  };

  // ===============================================
  // CLASES DE TAMAÑO
  // ===============================================
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const paddingClasses = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4',
  };

  // ===============================================
  // CLASES DE LA TABLA
  // ===============================================
  const tableClasses = clsx(
    'min-w-full divide-y divide-gray-200',
    sizeClasses[size],
    className
  );

  // ===============================================
  // RENDER LOADING
  // ===============================================
  if (loading) {
    return (
      <div className="bg-white shadow-soft rounded-lg overflow-hidden">
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" text="Cargando datos..." />
        </div>
      </div>
    );
  }

  // ===============================================
  // RENDER EMPTY
  // ===============================================
  if (!data || data.length === 0) {
    return (
      <div className="bg-white shadow-soft rounded-lg overflow-hidden">
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Sin datos
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {emptyText}
          </p>
        </div>
      </div>
    );
  }

  // ===============================================
  // RENDER PRINCIPAL
  // ===============================================
  return (
    <div className="bg-white shadow-soft rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className={tableClasses}>
          {/* Header */}
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={clsx(
                    paddingClasses[size],
                    'text-left text-xs font-medium text-gray-500 uppercase tracking-wider',
                    {
                      'text-left': column.align === 'left' || !column.align,
                      'text-center': column.align === 'center',
                      'text-right': column.align === 'right',
                    },
                    column.className
                  )}
                  style={{ width: column.width }}
                >
                  <div className="flex items-center gap-1">
                    {column.title}
                    {column.sortable && (
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
                        />
                      </svg>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((record, index) => (
              <tr
                key={getRowKey(record, index)}
                className={clsx(
                  {
                    'bg-gray-50': striped && index % 2 === 1,
                    'hover:bg-gray-50': hover,
                    'cursor-pointer': onRowClick,
                  }
                )}
                onClick={() => onRowClick?.(record, index)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={clsx(
                      paddingClasses[size],
                      'whitespace-nowrap text-gray-900',
                      {
                        'text-left': column.align === 'left' || !column.align,
                        'text-center': column.align === 'center',
                        'text-right': column.align === 'right',
                      }
                    )}
                  >
                    {getCellValue(column, record, index)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Table;