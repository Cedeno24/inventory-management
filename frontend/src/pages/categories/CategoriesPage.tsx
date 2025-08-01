// ===============================================
// PASO 9.31 - frontend/src/pages/categories/CategoriesPage.tsx
// PÁGINA DE CATEGORÍAS
// ===============================================

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Table, { Column } from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import CategoryForm from '../../components/forms/CategoryForm';
import { useApi } from '../../hooks/useApi';
import { usePagination } from '../../hooks/usePagination';
import { useDebounce } from '../../hooks/useDebounce';
import { categoryService } from '../../services/api';
import { Category } from '../../types';
import { formatNumber, formatDate } from '../../utils/formatters';

// ===============================================
// COMPONENTE PRINCIPAL
// ===============================================
const CategoriesPage: React.FC = () => {
  // ===============================================
  // ESTADO
  // ===============================================
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // ===============================================
  // HOOKS
  // ===============================================
  const pagination = usePagination({ initialLimit: 20 });
  const debouncedSearch = useDebounce(searchTerm, 300);

  // ===============================================
  // API HOOKS
  // ===============================================
  const {
    data: categoriesData,
    loading: categoriesLoading,
    execute: fetchCategories
  } = useApi(categoryService.getCategories);

  const {
    execute: deleteCategory,
    loading: deleteLoading
  } = useApi(categoryService.deleteCategory, {
    showSuccessToast: true,
    successMessage: 'Categoría eliminada exitosamente',
  });

  // ===============================================
  // EFECTOS
  // ===============================================
  useEffect(() => {
    loadCategories();
  }, [pagination.page, pagination.limit, debouncedSearch]);

  // ===============================================
  // FUNCIONES DE CARGA
  // ===============================================
  const loadCategories = async () => {
    const searchFilters = {
      search: debouncedSearch || undefined,
      page: pagination.page,
      limit: pagination.limit,
    };

    const result = await fetchCategories(searchFilters);
    if (result) {
      setCategories(result);
      pagination.setTotalItems(result.length);
    }
  };

  // ===============================================
  // MANEJADORES
  // ===============================================
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    pagination.firstPage();
  };

  const handleCreateCategory = () => {
    setSelectedCategory(null);
    setShowCreateModal(true);
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setShowEditModal(true);
  };

  const handleDeleteCategory = (category: Category) => {
    setSelectedCategory(category);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedCategory) return;

    const success = await deleteCategory(selectedCategory.id);
    if (success) {
      setShowDeleteDialog(false);
      setSelectedCategory(null);
      loadCategories();
    }
  };

  const handleCategorySubmit = (category: Category) => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedCategory(null);
    loadCategories();
  };

  // ===============================================
  // COLUMNAS DE LA TABLA
  // ===============================================
  const columns: Column<Category>[] = [
    {
      key: 'name',
      title: 'Nombre',
      dataIndex: 'name',
      render: (name: string, category: Category) => (
        <div>
          <div className="font-medium text-gray-900">{name}</div>
          {category.description && (
            <div className="text-sm text-gray-500 mt-1">
              {category.description}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'product_count',
      title: 'Productos',
      dataIndex: 'product_count',
      align: 'center',
      render: (count: number = 0) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {formatNumber(count)}
        </span>
      ),
    },
    {
      key: 'created_at',
      title: 'Fecha de Creación',
      dataIndex: 'created_at',
      render: (date: string) => (
        <span className="text-sm text-gray-500">
          {formatDate(date, 'es-ES', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'Acciones',
      align: 'right',
      render: (_, category: Category) => (
        <div className="flex items-center gap-2">
          <Button
            size="xs"
            variant="secondary"
            onClick={() => handleEditCategory(category)}
          >
            Editar
          </Button>
          <Button
            size="xs"
            variant="danger"
            onClick={() => handleDeleteCategory(category)}
            disabled={(category.product_count || 0) > 0}
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

  const FolderIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
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
          <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
          <p className="text-gray-600">Organiza tus productos por categorías</p>
        </div>
        <Button
          onClick={handleCreateCategory}
          leftIcon={<PlusIcon />}
        >
          Nueva Categoría
        </Button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-soft">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Búsqueda */}
          <div className="flex-1">
            <Input
              placeholder="Buscar categorías..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              leftIcon={<SearchIcon />}
            />
          </div>

          {/* Botón limpiar filtros */}
          <Button
            variant="ghost"
            onClick={() => {
              setSearchTerm('');
              pagination.firstPage();
            }}
          >
            Limpiar filtros
          </Button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      {categories.length > 0 && (
        <div className="bg-white shadow-soft rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(categories.length)}
              </div>
              <div className="text-sm text-blue-600">Categorías Totales</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatNumber(categories.reduce((sum, cat) => sum + (cat.product_count || 0), 0))}
              </div>
              <div className="text-sm text-green-600">Productos Totales</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {formatNumber(categories.filter(cat => (cat.product_count || 0) > 0).length)}
              </div>
              <div className="text-sm text-purple-600">Con Productos</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabla */}
      <Table
        columns={columns}
        data={categories}
        loading={categoriesLoading}
        emptyText="No se encontraron categorías"
      />

      {/* Paginación */}
      {categories.length > 0 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.limit}
          onPageChange={pagination.setPage}
          onItemsPerPageChange={pagination.setLimit}
        />
      )}

      {/* Modal crear categoría */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Crear Nueva Categoría"
        size="md"
      >
        <CategoryForm
          onSubmit={handleCategorySubmit}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Modal editar categoría */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Categoría"
        size="md"
      >
        {selectedCategory && (
          <CategoryForm
            category={selectedCategory}
            onSubmit={handleCategorySubmit}
            onCancel={() => setShowEditModal(false)}
          />
        )}
      </Modal>

      {/* Diálogo confirmar eliminación */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Eliminar Categoría"
        message={
          selectedCategory?.product_count && selectedCategory.product_count > 0
            ? `No puedes eliminar la categoría "${selectedCategory?.name}" porque tiene ${selectedCategory.product_count} producto(s) asociado(s). Primero mueve o elimina los productos.`
            : `¿Estás seguro de que quieres eliminar la categoría "${selectedCategory?.name}"? Esta acción no se puede deshacer.`
        }
        confirmText="Eliminar"
        confirmVariant="danger"
        isLoading={deleteLoading}
        icon="danger"
      />
    </div>
  );
};

export default CategoriesPage;