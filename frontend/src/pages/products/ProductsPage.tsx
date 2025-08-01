// ===============================================
// SOLUCIÓN DEFINITIVA - ProductsPage.tsx
// MODAL FUNCIONAL QUE SÍ APARECE
// ===============================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Table, { Column } from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ProductForm from '../../components/forms/ProductForm';
import { useApi } from '../../hooks/useApi';
import { usePagination } from '../../hooks/usePagination';
import { useDebounce } from '../../hooks/useDebounce';
import { productService, categoryService } from '../../services/api';
import { Product, Category, ProductFilters } from '../../types';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters';

// ===============================================
// MODAL PERSONALIZADO QUE SÍ FUNCIONA
// ===============================================
interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const CustomModal: React.FC<CustomModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'lg' 
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" style={{ display: 'block' }}>
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        
        {/* Spacer para centrar */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        {/* Modal */}
        <div 
          className={`relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full ${sizeClasses[size]}`}
          style={{ zIndex: 51 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// ===============================================
// COMPONENTE PRINCIPAL
// ===============================================
const ProductsPage: React.FC = () => {
  const renderCount = useRef(0);
  renderCount.current += 1;

  // ===============================================
  // ESTADO
  // ===============================================
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    category_id: undefined,
    stock_status: undefined,
  });
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);

  // ===============================================
  // HOOKS
  // ===============================================
  const pagination = usePagination({ initialLimit: 20 });
  const debouncedSearch = useDebounce(filters.search, 300);

  // ===============================================
  // FUNCIONES DE CARGA
  // ===============================================
  const loadProducts = useCallback(async () => {
    console.log('🔄 Cargando productos...');
    setIsLoadingProducts(true);
    
    try {
      const searchFilters: ProductFilters = {
        search: debouncedSearch || undefined,
        category_id: filters.category_id || undefined,
        stock_status: filters.stock_status || undefined,
        page: pagination.page,
        limit: pagination.limit,
      };

      const result = await productService.getProducts(searchFilters);
      
      if (result?.data) {
        const productsKey = Object.keys(result.data).find(key => Array.isArray(result.data[key]));
        if (productsKey && result.data[productsKey]) {
          setProducts(result.data[productsKey] as Product[]);
          pagination.setTotalItems(result.data.pagination?.total_items || 0);
          console.log('✅ Productos cargados:', result.data[productsKey].length);
        }
      }
    } catch (error: any) {
      console.error('❌ Error cargando productos:', error);
      toast.error('Error al cargar productos');
    } finally {
      setIsLoadingProducts(false);
    }
  }, [debouncedSearch, filters.category_id, filters.stock_status, pagination.page, pagination.limit, pagination.setTotalItems]);

  const loadCategories = useCallback(async () => {
    console.log('🔄 Cargando categorías...');
    setIsLoadingCategories(true);
    
    try {
      const result = await categoryService.getCategories();
      if (result) {
        setCategories(result);
        console.log('✅ Categorías cargadas:', result.length);
      }
    } catch (error: any) {
      console.error('❌ Error cargando categorías:', error);
      toast.error('Error al cargar categorías');
    } finally {
      setIsLoadingCategories(false);
    }
  }, []);

  // ===============================================
  // MANEJADORES DE MODALES
  // ===============================================
  const handleCreateProduct = useCallback(() => {
    console.log('🔧 CREAR PRODUCTO - Abriendo modal');
    console.log('🔧 Estado antes:', showCreateModal);
    setSelectedProduct(null);
    setShowCreateModal(true);
    console.log('🔧 setShowCreateModal(true) ejecutado');
  }, [showCreateModal]);

  const handleEditProduct = useCallback((product: Product) => {
    console.log('🔧 EDITAR PRODUCTO:', product.name);
    setSelectedProduct(product);
    setShowEditModal(true);
  }, []);

  const handleDeleteProduct = useCallback((product: Product) => {
    console.log('🔧 ELIMINAR PRODUCTO:', product.name);
    setSelectedProduct(product);
    setShowDeleteDialog(true);
  }, []);

  const handleCloseCreateModal = useCallback(() => {
    console.log('🔧 Cerrando modal crear');
    setShowCreateModal(false);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    console.log('🔧 Cerrando modal editar');
    setShowEditModal(false);
  }, []);

  const handleCloseDeleteDialog = useCallback(() => {
    console.log('🔧 Cerrando diálogo eliminar');
    setShowDeleteDialog(false);
  }, []);

  const handleProductSubmit = useCallback(async (product: Product) => {
    console.log('🔧 Producto guardado:', product.name);
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedProduct(null);
    await loadProducts();
    toast.success(`Producto ${product.id ? 'actualizado' : 'creado'} exitosamente`);
  }, [loadProducts]);

  const confirmDelete = useCallback(async () => {
    if (!selectedProduct) return;
    
    console.log('🔧 Confirmando eliminación:', selectedProduct.name);
    setIsDeletingProduct(true);

    try {
      await productService.deleteProduct(selectedProduct.id);
      toast.success('Producto eliminado exitosamente');
      setShowDeleteDialog(false);
      setSelectedProduct(null);
      await loadProducts();
    } catch (error: any) {
      console.error('❌ Error eliminando producto:', error);
      toast.error(error.message || 'Error al eliminar producto');
    } finally {
      setIsDeletingProduct(false);
    }
  }, [selectedProduct, loadProducts]);

  // ===============================================
  // MANEJADORES DE FILTROS
  // ===============================================
  const handleSearch = useCallback((searchTerm: string) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
    pagination.firstPage();
  }, [pagination]);

  const handleCategoryFilter = useCallback((categoryId: string) => {
    setFilters(prev => ({ 
      ...prev, 
      category_id: categoryId ? parseInt(categoryId) : undefined 
    }));
    pagination.firstPage();
  }, [pagination]);

  const handleStockFilter = useCallback((stockStatus: string) => {
    setFilters(prev => ({ 
      ...prev, 
      stock_status: (stockStatus as 'LOW' | 'MEDIUM' | 'HIGH') || undefined 
    }));
    pagination.firstPage();
  }, [pagination]);

  // ===============================================
  // EFECTOS
  // ===============================================
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Effect para debug
  useEffect(() => {
    console.log('🔧 Estado modal crear:', showCreateModal);
  }, [showCreateModal]);

  useEffect(() => {
    console.log('🔧 Estado modal editar:', showEditModal);
  }, [showEditModal]);

  // ===============================================
  // COLUMNAS DE LA TABLA
  // ===============================================
  const columns: Column<Product>[] = [
    {
      key: 'name',
      title: 'Producto',
      dataIndex: 'name',
      render: (name: string, product: Product) => (
        <div>
          <div 
            className="font-medium text-primary-600 hover:text-primary-500 cursor-pointer"
            onClick={() => window.location.href = `/products/${product.id}`}
          >
            {name}
          </div>
          {product.description && (
            <p className="text-sm text-gray-500 mt-1 truncate max-w-xs">
              {product.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      title: 'Categoría',
      dataIndex: 'category_name',
      render: (categoryName: string) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {categoryName || 'Sin categoría'}
        </span>
      ),
    },
    {
      key: 'price',
      title: 'Precio',
      dataIndex: 'price',
      align: 'right',
      render: (price: number) => (
        <span className="font-medium text-gray-900">
          {formatCurrency(price)}
        </span>
      ),
    },
    {
      key: 'quantity',
      title: 'Stock',
      dataIndex: 'quantity',
      align: 'center',
      render: (quantity: number, product: Product) => {
        const isLowStock = quantity <= product.min_stock;
        return (
          <div className="flex items-center justify-center">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isLowStock 
                ? 'bg-red-100 text-red-800' 
                : quantity <= product.min_stock * 2
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-green-100 text-green-800'
            }`}>
              {formatNumber(quantity)}
            </span>
          </div>
        );
      },
    },
    {
      key: 'min_stock',
      title: 'Stock Mín.',
      dataIndex: 'min_stock',
      align: 'center',
      render: (minStock: number) => (
        <span className="text-sm text-gray-500">
          {formatNumber(minStock)}
        </span>
      ),
    },
    {
      key: 'created_at',
      title: 'Creado',
      dataIndex: 'created_at',
      render: (date: string) => (
        <span className="text-sm text-gray-500">
          {formatDate(date)}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Acciones',
      align: 'right',
      render: (_, product: Product) => (
        <div className="flex items-center gap-2">
          <Button
            size="xs"
            variant="secondary"
            onClick={() => handleEditProduct(product)}
            disabled={false}
            isLoading={false}
            type="button"
          >
            Editar
          </Button>
          <Button
            size="xs"
            variant="danger"
            onClick={() => handleDeleteProduct(product)}
            disabled={false}
            isLoading={false}
            type="button"
          >
            Eliminar
          </Button>
        </div>
      ),
    },
  ];

  // ===============================================
  // ICONOS
  // ===============================================
  const SearchIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  const PlusIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );

  // ===============================================
  // LOGGING DE RENDER
  // ===============================================
  console.log(`🔧 RENDER ProductsPage #${renderCount.current}:`, {
    showCreateModal,
    showEditModal,
    showDeleteDialog,
    productsCount: products.length,
    categoriesCount: categories.length,
    selectedProduct: selectedProduct?.name || null
  });

  // Force log del estado del modal
  if (showCreateModal) {
    console.log('🟢 MODAL CREAR DEBERÍA ESTAR VISIBLE');
  } else {
    console.log('🔴 MODAL CREAR ESTÁ CERRADO');
  }

  // ===============================================
  // RENDER
  // ===============================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-600">Gestiona tu inventario de productos</p>
        </div>
        
        {/* BOTÓN PRINCIPAL */}
        <Button
          onClick={handleCreateProduct}
          leftIcon={<PlusIcon />}
          disabled={false}
          isLoading={false}
          type="button"
          className="shrink-0"
        >
          Nuevo Producto
        </Button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-soft">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            placeholder="Buscar productos..."
            value={filters.search}
            onChange={(e) => handleSearch(e.target.value)}
            leftIcon={<SearchIcon />}
          />

          <select
            value={filters.category_id || ''}
            onChange={(e) => handleCategoryFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Todas las categorías</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <select
            value={filters.stock_status || ''}
            onChange={(e) => handleStockFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Todo el stock</option>
            <option value="LOW">Stock bajo</option>
            <option value="MEDIUM">Stock medio</option>
            <option value="HIGH">Stock alto</option>
          </select>

          <Button
            variant="ghost"
            onClick={() => {
              setFilters({ search: '', category_id: undefined, stock_status: undefined });
              pagination.firstPage();
            }}
            disabled={false}
            type="button"
          >
            Limpiar filtros
          </Button>
        </div>
      </div>

      {/* Tabla */}
      <Table
        columns={columns}
        data={products}
        loading={isLoadingProducts}
        emptyText="No se encontraron productos"
        // Remover onRowClick que causa problemas
      />

      {/* Paginación */}
      {products.length > 0 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.limit}
          onPageChange={pagination.setPage}
          onItemsPerPageChange={pagination.setLimit}
        />
      )}

      {/* MODALES CON COMPONENTE PERSONALIZADO */}
      
      {/* Modal crear producto - PERSONALIZADO */}
      <CustomModal
        isOpen={showCreateModal}
        onClose={handleCloseCreateModal}
        title="Crear Nuevo Producto"
        size="lg"
      >
        <ProductForm
          onSubmit={handleProductSubmit}
          onCancel={handleCloseCreateModal}
          isLoading={false}
        />
      </CustomModal>

      {/* Modal editar producto - PERSONALIZADO */}
      <CustomModal
        isOpen={showEditModal}
        onClose={handleCloseEditModal}
        title="Editar Producto"
        size="lg"
      >
        {selectedProduct && (
          <ProductForm
            product={selectedProduct}
            onSubmit={handleProductSubmit}
            onCancel={handleCloseEditModal}
            isLoading={false}
          />
        )}
      </CustomModal>

      {/* Diálogo confirmar eliminación - PERSONALIZADO */}
      <CustomModal
        isOpen={showDeleteDialog}
        onClose={handleCloseDeleteDialog}
        title="Eliminar Producto"
        size="sm"
      >
        {selectedProduct && (
          <div className="space-y-4">
            {/* Icono y mensaje */}
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Eliminar Producto
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  ¿Estás seguro de que quieres eliminar el producto "<strong>{selectedProduct.name}</strong>"? Esta acción no se puede deshacer.
                </p>
              </div>
            </div>

            {/* Botones */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200">
              <Button
                variant="secondary"
                onClick={handleCloseDeleteDialog}
                disabled={isDeletingProduct}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={confirmDelete}
                isLoading={isDeletingProduct}
                disabled={isDeletingProduct}
                className="w-full sm:w-auto"
              >
                {isDeletingProduct ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          </div>
        )}
      </CustomModal>
    </div>
  );
};

export default ProductsPage;