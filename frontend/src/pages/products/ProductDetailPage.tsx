// ===============================================
// PASO 9.29 - frontend/src/pages/products/ProductDetailPage.tsx
// PÁGINA DETALLE DE PRODUCTO
// ===============================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Button from '../../components/common/Button';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ProductForm from '../../components/forms/ProductForm';
import Table, { Column } from '../../components/common/Table';
import { useApi } from '../../hooks/useApi';
import { productService, inventoryService } from '../../services/api';
import { Product, InventoryMovement } from '../../types';
import { formatCurrency, formatNumber, formatDateTime, formatRelativeTime } from '../../utils/formatters';
import { MOVEMENT_TYPE_LABELS, MOVEMENT_TYPE_COLORS } from '../../utils/constants';

// ===============================================
// COMPONENTE PRINCIPAL
// ===============================================
const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // ===============================================
  // ESTADO
  // ===============================================
  const [product, setProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // ===============================================
  // API HOOKS
  // ===============================================
  const {
    data: productData,
    loading: productLoading,
    error: productError,
    execute: fetchProduct
  } = useApi(productService.getProduct);

  const {
    data: movementsData,
    loading: movementsLoading,
    execute: fetchMovements
  } = useApi(inventoryService.getMovements);

  const {
    execute: deleteProduct,
    loading: deleteLoading
  } = useApi(productService.deleteProduct, {
    showSuccessToast: true,
    successMessage: 'Producto eliminado exitosamente',
  });

  // ===============================================
  // EFECTOS
  // ===============================================
  useEffect(() => {
    if (id) {
      loadProduct();
      loadMovements();
    }
  }, [id]);

  // ===============================================
  // FUNCIONES DE CARGA
  // ===============================================
  const loadProduct = async () => {
    if (!id) return;
    const result = await fetchProduct(parseInt(id));
    if (result) {
      setProduct(result);
    }
  };

  const loadMovements = async () => {
    if (!id) return;
    const result = await fetchMovements({ product_id: parseInt(id), limit: 10 });
    if (result?.data) {
      const movementsKey = Object.keys(result.data).find(key => Array.isArray(result.data[key]));
      if (movementsKey && result.data[movementsKey]) {
        setMovements(result.data[movementsKey] as InventoryMovement[]);
      }
    }
  };

  // ===============================================
  // MANEJADORES
  // ===============================================
  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!product) return;

    const success = await deleteProduct(product.id);
    if (success) {
      navigate('/products');
    }
  };

  const handleProductUpdate = (updatedProduct: Product) => {
    setProduct(updatedProduct);
    setShowEditModal(false);
    loadMovements(); // Recargar movimientos por si cambió algo
  };

  // ===============================================
  // COLUMNAS DE MOVIMIENTOS
  // ===============================================
  const movementColumns: Column<InventoryMovement>[] = [
    {
      key: 'movement_type',
      title: 'Tipo',
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
          {quantity > 0 ? '+' : ''}{quantity}
        </span>
      ),
    },
    {
      key: 'quantity_after',
      title: 'Stock Final',
      dataIndex: 'quantity_after',
      align: 'center',
      render: (quantity: number) => (
        <span className="font-medium text-gray-900">
          {formatNumber(quantity)}
        </span>
      ),
    },
    {
      key: 'username',
      title: 'Usuario',
      dataIndex: 'username',
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
  ];

  // ===============================================
  // ICONOS
  // ===============================================
  const BackIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );

  const EditIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );

  const DeleteIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );

  // ===============================================
  // RENDER LOADING
  // ===============================================
  if (productLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Cargando producto..." />
      </div>
    );
  }

  // ===============================================
  // RENDER ERROR
  // ===============================================
  if (productError || !product) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Producto no encontrado
        </h3>
        <p className="text-gray-600 mb-4">
          {productError || 'El producto que buscas no existe o fue eliminado.'}
        </p>
        <Button onClick={() => navigate('/products')}>
          Volver a Productos
        </Button>
      </div>
    );
  }

  // ===============================================
  // CALCULAR ESTADO DEL STOCK
  // ===============================================
  const stockStatus = product.quantity <= product.min_stock ? 'low' : 
                     product.quantity <= product.min_stock * 2 ? 'medium' : 'high';
  
  const stockStatusConfig = {
    low: { color: 'red', label: 'Stock Bajo', bgColor: 'bg-red-100', textColor: 'text-red-800' },
    medium: { color: 'yellow', label: 'Stock Medio', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' },
    high: { color: 'green', label: 'Stock Alto', bgColor: 'bg-green-100', textColor: 'text-green-800' },
  };

  // ===============================================
  // RENDER PRINCIPAL
  // ===============================================
  return (
    <div className="space-y-6">
      {/* Navegación */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/products')}
          leftIcon={<BackIcon />}
        >
          Volver a Productos
        </Button>
      </div>

      {/* Header del producto */}
      <div className="bg-white shadow-soft rounded-lg p-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {product.name}
                </h1>
                {product.description && (
                  <p className="text-gray-600 mb-4">
                    {product.description}
                  </p>
                )}
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {product.category_name}
                  </span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${stockStatusConfig[stockStatus].bgColor} ${stockStatusConfig[stockStatus].textColor}`}>
                    {stockStatusConfig[stockStatus].label}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={handleEdit}
                  leftIcon={<EditIcon />}
                >
                  Editar
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDelete}
                  leftIcon={<DeleteIcon />}
                >
                  Eliminar
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Información del producto */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Estadísticas principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Métricas */}
          <div className="bg-white shadow-soft rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Información de Inventario
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {formatNumber(product.quantity)}
                </div>
                <div className="text-sm text-gray-600">Stock Actual</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {formatNumber(product.min_stock)}
                </div>
                <div className="text-sm text-gray-600">Stock Mínimo</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(product.price)}
                </div>
                <div className="text-sm text-gray-600">Precio</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(product.price * product.quantity)}
                </div>
                <div className="text-sm text-gray-600">Valor Total</div>
              </div>
            </div>
          </div>

          {/* Movimientos recientes */}
          <div className="bg-white shadow-soft rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Movimientos Recientes
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/inventory?product_id=${product.id}`)}
              >
                Ver todos
              </Button>
            </div>
            <Table
              columns={movementColumns}
              data={movements}
              loading={movementsLoading}
              emptyText="No hay movimientos registrados"
              size="sm"
            />
          </div>
        </div>

        {/* Panel lateral */}
        <div className="space-y-6">
          {/* Información adicional */}
          <div className="bg-white shadow-soft rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Detalles
            </h3>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">ID del Producto</span>
                <p className="text-sm text-gray-900">{product.id}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Creado</span>
                <p className="text-sm text-gray-900">{product.created_at ? formatDateTime(product.created_at) : 'N/A'}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Última actualización</span>
                <p className="text-sm text-gray-900">{product.updated_at ? formatDateTime(product.updated_at) : 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Alerta de stock bajo */}
          {stockStatus === 'low' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Stock Bajo
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    El stock actual ({product.quantity}) está por debajo del mínimo recomendado ({product.min_stock}).
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal editar producto */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Producto"
        size="lg"
      >
        <ProductForm
          product={product}
          onSubmit={handleProductUpdate}
          onCancel={() => setShowEditModal(false)}
        />
      </Modal>

      {/* Diálogo confirmar eliminación */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Eliminar Producto"
        message={`¿Estás seguro de que quieres eliminar el producto "${product.name}"? Esta acción no se puede deshacer y eliminará todos los registros relacionados.`}
        confirmText="Eliminar"
        confirmVariant="danger"
        isLoading={deleteLoading}
        icon="danger"
      />
    </div>
  );
};

export default ProductDetailPage;