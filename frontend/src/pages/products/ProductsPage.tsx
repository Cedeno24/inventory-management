// ===============================================
// PASO 9.28 - frontend/src/pages/products/ProductsPage.tsx
// PÁGINA DE PRODUCTOS
// ===============================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Table, { Column } from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ProductForm from '../../components/forms/ProductForm';
import { useApi } from '../../hooks/useApi';
import { usePagination } from '../../hooks/usePagination';
import { useDebounce } from '../../hooks/useDebounce';
import { productService, categoryService } from '../../services/api';
import { Product, Category, ProductFilters } from '../../types';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters';

// ===============================================
// COMPONENTE PRINCIPAL
// ===============================================
const ProductsPage: React.FC = () => {
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

  // ===============================================
  // HOOKS
  // ===============================================
  const pagination = usePagination({ initialLimit: 20 });
  const debouncedSearch = useDebounce(filters.search, 300);

  // ===============================================
  // API HOOKS
  // ===============================================
  const {
    data: productsData,
    loading: productsLoading,
    execute: fetchProducts
  } = useApi(productService.getProducts);

  const {
    data: categoriesData,
    execute: fetchCategories
  } = useApi(categoryService.getCategories);

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
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [pagination.page, pagination.limit, debouncedSearch, filters.category_id, filters.stock_status]);

  // ===============================================
  // FUNCIONES DE CARGA
  // ===============================================
  const loadCategories = async () => {
    const result = await fetchCategories();
    if (result) {
      setCategories(result);
    }
  };

  const loadProducts = async () => {
    const searchFilters: ProductFilters = {
      search: debouncedSearch || undefined,
      category_id: filters.category_id || undefined,
      stock_status: filters.stock_status || undefined,
      page: pagination.page,
      limit: pagination.limit,
    };

    const result = await fetchProducts(searchFilters);
    if (result?.data) {
      const productsKey = Object.keys(result.data).find(key => Array.isArray(result.data[key]));
      if (productsKey && result.data[productsKey]) {
        setProducts(result.data[productsKey] as Product[]);
        pagination.setTotalItems(result.data.pagination.total_items);
      }
    }
  };

  // ===============================================
  // MANEJADORES
  // ===============================================
  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    pagination.firstPage();
  };

  const handleCategoryFilter = (categoryId: string) => {
    setFilters(prev => ({ 
      ...prev, 
      category_id: categoryId ? parseInt(categoryId) : undefined 
    }));
    pagination.firstPage();
  };

  const handleStockFilter = (stockStatus: string) => {
    setFilters(prev => ({ 
      ...prev, 
      stock_status: (stockStatus as 'LOW' | 'MEDIUM' | 'HIGH') || undefined 
    }));
    pagination.firstPage();
  };

  const handleCreateProduct = () => {
    setSelectedProduct(null);
    setShowCreateModal(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowEditModal(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedProduct) return;

    const success = await deleteProduct(selectedProduct.id);
    if (success) {
      setShowDeleteDialog(false);
      setSelectedProduct(null);
      loadProducts();
    }
  };

  const handleProductSubmit = (product: Product) => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedProduct(null);
    loadProducts();
  };

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
          <Link 
            to={`/products/${product.id}`}
            className="font-medium text-primary-600 hover:text-primary-500"
          >
            {name}
          </Link>
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
          {categoryName}
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
        <span className="text-gray-600">
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
          {formatDate(date, 'es-ES', { month: 'short', day: 'numeric' })}
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
          >
            Editar
          </Button>
          <Button
            size="xs"
            variant="danger"
            onClick={() => handleDeleteProduct(product)}
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
        <Button
          onClick={handleCreateProduct}
          leftIcon={<PlusIcon />}
        >
          Nuevo Producto
        </Button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-soft">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <Input
            placeholder="Buscar productos..."
            value={filters.search}
            onChange={(e) => handleSearch(e.target.value)}
            leftIcon={<SearchIcon />}
          />

          {/* Filtro por categoría */}
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

          {/* Filtro por stock */}
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

          {/* Botón limpiar filtros */}
          <Button
            variant="ghost"
            onClick={() => {
              setFilters({ search: '', category_id: undefined, stock_status: undefined });
              pagination.firstPage();
            }}
          >
            Limpiar filtros
          </Button>
        </div>
      </div>

      {/* Tabla */}
      <Table
        columns={columns}
        data={products}
        loading={productsLoading}
        emptyText="No se encontraron productos"
        onRowClick={(product) => window.open(`/products/${product.id}`, '_blank')}
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

      {/* Modal crear producto */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Crear Nuevo Producto"
        size="lg"
      >
        <ProductForm
          onSubmit={handleProductSubmit}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Modal editar producto */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Producto"
        size="lg"
      >
        {selectedProduct && (
          <ProductForm
            product={selectedProduct}
            onSubmit={handleProductSubmit}
            onCancel={() => setShowEditModal(false)}
          />
        )}
      </Modal>

      {/* Diálogo confirmar eliminación */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Eliminar Producto"
        message={`¿Estás seguro de que quieres eliminar el producto "${selectedProduct?.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        confirmVariant="danger"
        isLoading={deleteLoading}
        icon="danger"
      />
    </div>
  );
};

export default ProductsPage;