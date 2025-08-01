// ===============================================
// PASO 9.32 - frontend/src/pages/inventory/InventoryPage.tsx
// PÁGINA DE MOVIMIENTOS DE INVENTARIO
// ===============================================

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Table, { Column } from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import { useApi } from '../../hooks/useApi';
import { usePagination } from '../../hooks/usePagination';
import { useDebounce } from '../../hooks/useDebounce';
import { inventoryService, productService } from '../../services/api';
import { InventoryMovement, Product, MovementFilters } from '../../types';
import { formatNumber, formatDateTime, formatRelativeTime } from '../../utils/formatters';
import { MOVEMENT_TYPE_LABELS, MOVEMENT_TYPE_COLORS } from '../../utils/constants';

// ===============================================
// COMPONENTE PRINCIPAL
// ===============================================
const InventoryPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  
  // ===============================================
  // ESTADO
  // ===============================================
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState<MovementFilters>({
    product_id: searchParams.get('product_id') ? parseInt(searchParams.get('product_id')!) : undefined,
    movement_type: undefined,
  });

  // ===============================================
  // HOOKS
  // ===============================================
  const pagination = usePagination({ initialLimit: 20 });

  // ===============================================
  // API HOOKS
  // ===============================================
  const {
    data: movementsData,
    loading: movementsLoading,
    execute: fetchMovements
  } = useApi(inventoryService.getMovements);

  const {
    data: productsData,
    execute: fetchProducts
  } = useApi(productService.getProducts);

  // ===============================================
  // EFECTOS
  // ===============================================
  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    loadMovements();
  }, [pagination.page, pagination.limit, filters.product_id, filters.movement_type]);

  // ===============================================
  // FUNCIONES DE CARGA
  // ===============================================
  const loadProducts = async () => {
    const result = await fetchProducts({ limit: 1000 });
    if (result?.data) {
      const productsKey = Object.keys(result.data).find(key => Array.isArray(result.data[key]));
      if (productsKey && result.data[productsKey]) {
        setProducts(result.data[productsKey] as Product[]);
      }
    }
  };

  const loadMovements = async () => {
    const searchFilters: MovementFilters = {
      product_id: filters.product_id || undefined,
      movement_type: filters.movement_type || undefined,
      page: pagination.page,
      limit: pagination.limit,
    };

    const result = await fetchMovements(searchFilters);
    if (result?.data) {
      const movementsKey = Object.keys(result.data).find(key => Array.isArray(result.data[key]));
      if (movementsKey && result.data[movementsKey]) {
        setMovements(result.data[movementsKey] as InventoryMovement[]);
        pagination.setTotalItems(result.data.pagination.total_items);
      }
    }
  };

  // ===============================================
  // MANEJADORES
  // ===============================================
  const handleProductFilter = (productId: string) => {
    setFilters(prev => ({ 
      ...prev, 
      product_id: productId ? parseInt(productId) : undefined 
    }));
    pagination.firstPage();
  };

  const handleMovementTypeFilter = (movementType: string) => {
    setFilters(prev => ({ 
      ...prev, 
      movement_type: movementType || undefined 
    }));
    pagination.firstPage();
  };

  const clearFilters = () => {
    setFilters({ product_id: undefined, movement_type: undefined });
    pagination.firstPage();
  };

  // ===============================================
  // COLUMNAS DE LA TABLA
  // ===============================================
  const columns: Column<InventoryMovement>[] = [
    {
      key: 'product_name',
      title: 'Producto',
      dataIndex: 'product_name',
      render: (productName: string, movement: InventoryMovement) => (
        <div>
          <div className="font-medium text-gray-900">{productName}</div>
          <div className="text-sm text-gray-500">{movement.category_name}</div>
        </div>
      ),
    },
    {
      key: 'movement_type',
      title: 'Tipo de Movimiento',
      dataIndex: 'movement_type',
      render: (type: string) => {
        const color = MOVEMENT_TYPE_COLORS[type as keyof typeof MOVEMENT_TYPE_COLORS] || 'secondary';
        const colorClasses = {
          primary: 'bg-blue-100 text-blue-800',
          secondary: 'bg-gray-100 text-gray-800',
          success: 'bg-green-100 text-green-800',
          warning: 'bg-yellow-100 text-yellow-800',
          danger: 'bg-red-100 text-red-800',
        };

        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[color]}`}>
            {MOVEMENT_TYPE_LABELS[type as keyof typeof MOVEMENT_TYPE_LABELS] || type}
          </span>
        );
      },
    },
    {
      key: 'quantity_changed',
      title: 'Cantidad',
      dataIndex: 'quantity_changed',
      align: 'center',
      render: (quantity: number) => (
        <span className={`font-medium ${quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {quantity > 0 ? '+' : ''}{formatNumber(quantity)}
        </span>
      ),
    },
    {
      key: 'stock_before_after',
      title: 'Stock',
      align: 'center',
      render: (_, movement: InventoryMovement) => (
        <div className="text-sm">
          <div className="text-gray-500">
            {movement.quantity_before !== null && movement.quantity_before !== undefined ? formatNumber(movement.quantity_before) : 'N/A'}
          </div>
          <div className="text-xs text-gray-400">↓</div>
          <div className="font-medium text-gray-900">
            {movement.quantity_after !== null && movement.quantity_after !== undefined ? formatNumber(movement.quantity_after) : 'N/A'}
          </div>
        </div>
      ),
    },
    {
      key: 'username',
      title: 'Usuario',
      dataIndex: 'username',
      render: (username: string) => (
        <span className="text-sm text-gray-600">{username}</span>
      ),
    },
    {
      key: 'created_at',
      title: 'Fecha',
      dataIndex: 'created_at',
      render: (date: string) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {formatDateTime(date)}
          </div>
          <div className="text-xs text-gray-500">
            {formatRelativeTime(date)}
          </div>
        </div>
      ),
    },
    {
      key: 'reason',
      title: 'Motivo',
      dataIndex: 'reason',
      render: (reason: string, movement: InventoryMovement) => (
        <div className="max-w-xs">
          {reason && (
            <div className="text-sm text-gray-900 mb-1">{reason}</div>
          )}
          {movement.notes && (
            <div className="text-xs text-gray-500 truncate">{movement.notes}</div>
          )}
        </div>
      ),
    },
  ];

  // ===============================================
  // ICONOS
  // ===============================================
  const FilterIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
    </svg>
  );

  const RefreshIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );

  // ===============================================
  // TIPOS DE MOVIMIENTO PARA EL FILTRO
  // ===============================================
  const movementTypeOptions = [
    { value: '', label: 'Todos los tipos' },
    { value: 'CREATE', label: 'Producto Creado' },
    { value: 'UPDATE', label: 'Producto Actualizado' },
    { value: 'DELETE', label: 'Producto Eliminado' },
    { value: 'STOCK_IN', label: 'Entrada de Stock' },
    { value: 'STOCK_OUT', label: 'Salida de Stock' },
  ];

  // ===============================================
  // RENDER
  // ===============================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Movimientos de Inventario</h1>
          <p className="text-gray-600">Historial de cambios en el inventario</p>
        </div>
        <Button
          onClick={loadMovements}
          leftIcon={<RefreshIcon />}
          variant="secondary"
        >
          Actualizar
        </Button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-soft">
        <div className="flex items-center gap-2 mb-4">
          <FilterIcon />
          <h3 className="text-sm font-medium text-gray-900">Filtros</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Filtro por producto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Producto
            </label>
            <select
              value={filters.product_id || ''}
              onChange={(e) => handleProductFilter(e.target.value)}
              className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Todos los productos</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por tipo de movimiento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Movimiento
            </label>
            <select
              value={filters.movement_type || ''}
              onChange={(e) => handleMovementTypeFilter(e.target.value)}
              className="block w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {movementTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Botón limpiar filtros */}
          <div className="flex items-end">
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="w-full"
            >
              Limpiar filtros
            </Button>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      {movements.length > 0 && (
        <div className="bg-white shadow-soft rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de Movimientos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(movements.filter(m => m.movement_type === 'STOCK_IN').length)}
              </div>
              <div className="text-sm text-blue-600">Entradas</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {formatNumber(movements.filter(m => m.movement_type === 'STOCK_OUT').length)}
              </div>
              <div className="text-sm text-red-600">Salidas</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatNumber(movements.filter(m => m.movement_type === 'CREATE').length)}
              </div>
              <div className="text-sm text-green-600">Creados</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {formatNumber(movements.filter(m => m.movement_type === 'UPDATE').length)}
              </div>
              <div className="text-sm text-yellow-600">Actualizados</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabla */}
      <Table
        columns={columns}
        data={movements}
        loading={movementsLoading}
        emptyText="No se encontraron movimientos de inventario"
        size="sm"
      />

      {/* Paginación */}
      {movements.length > 0 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.limit}
          onPageChange={pagination.setPage}
          onItemsPerPageChange={pagination.setLimit}
        />
      )}
    </div>
  );
};

export default InventoryPage;