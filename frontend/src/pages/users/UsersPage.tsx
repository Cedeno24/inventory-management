// ===============================================
// PASO 9.34 - frontend/src/pages/users/UsersPage.tsx
// PÁGINA DE USUARIOS (SOLO ADMIN)
// ===============================================

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Table, { Column } from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import UserForm from '../../components/forms/UserForm';
import { useApi } from '../../hooks/useApi';
import { usePagination } from '../../hooks/usePagination';
import { useDebounce } from '../../hooks/useDebounce';
import { useAuth } from '../../hooks/useAuth';
import { userService } from '../../services/api';
import { User } from '../../types';
import { formatDate, formatRelativeTime } from '../../utils/formatters';

// ===============================================
// COMPONENTE PRINCIPAL
// ===============================================
const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  
  // ===============================================
  // ESTADO
  // ===============================================
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // ===============================================
  // HOOKS
  // ===============================================
  const pagination = usePagination({ initialLimit: 20 });
  const debouncedSearch = useDebounce(searchTerm, 300);

  // ===============================================
  // API HOOKS
  // ===============================================
  const {
    data: usersData,
    loading: usersLoading,
    execute: fetchUsers
  } = useApi(userService.getUsers);

  const {
    execute: deleteUser,
    loading: deleteLoading
  } = useApi(userService.deleteUser, {
    showSuccessToast: true,
    successMessage: 'Usuario eliminado exitosamente',
  });

  // ===============================================
  // EFECTOS
  // ===============================================
  useEffect(() => {
    loadUsers();
  }, [pagination.page, pagination.limit, debouncedSearch, roleFilter]);

  // ===============================================
  // FUNCIONES DE CARGA
  // ===============================================
  const loadUsers = async () => {
    const searchFilters = {
      search: debouncedSearch || undefined,
      role: roleFilter || undefined,
      page: pagination.page,
      limit: pagination.limit,
    };

    const result = await fetchUsers(searchFilters);
    if (result?.data) {
      const usersKey = Object.keys(result.data).find(key => Array.isArray(result.data[key]));
      if (usersKey && result.data[usersKey]) {
        setUsers(result.data[usersKey] as User[]);
        pagination.setTotalItems(result.data.pagination?.total_items || result.data[usersKey].length);
      }
    }
  };

  // ===============================================
  // MANEJADORES
  // ===============================================
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    pagination.firstPage();
  };

  const handleRoleFilter = (role: string) => {
    setRoleFilter(role);
    pagination.firstPage();
  };

  const handleCreateUser = () => {
    setSelectedUser(null);
    setShowCreateModal(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDeleteUser = (user: User) => {
    if (user.id === currentUser?.id) {
      toast.error('No puedes eliminar tu propia cuenta');
      return;
    }
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;

    const success = await deleteUser(selectedUser.id);
    if (success) {
      setShowDeleteDialog(false);
      setSelectedUser(null);
      loadUsers();
    }
  };

  const handleUserSubmit = (user: User) => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedUser(null);
    loadUsers();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('');
    pagination.firstPage();
  };

  // ===============================================
  // COLUMNAS DE LA TABLA
  // ===============================================
  const columns: Column<User>[] = [
    {
      key: 'user_info',
      title: 'Usuario',
      render: (_, user: User) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-medium text-gray-900">{user.username}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      title: 'Rol',
      dataIndex: 'role',
      render: (role: string) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          role === 'admin' 
            ? 'bg-purple-100 text-purple-800' 
            : 'bg-blue-100 text-blue-800'
        }`}>
          {role === 'admin' ? 'Administrador' : 'Usuario'}
        </span>
      ),
    },
    {
      key: 'created_at',
      title: 'Fecha de Registro',
      dataIndex: 'created_at',
      render: (date: string) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {formatDate(date, 'es-ES', { 
              year: 'numeric', 
              month: 'short', 
              day: 'numeric' 
            })}
          </div>
          <div className="text-xs text-gray-500">
            {formatRelativeTime(date)}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Estado',
      render: (_, user: User) => {
        const isCurrentUser = user.id === currentUser?.id;
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isCurrentUser 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {isCurrentUser ? 'Sesión Activa' : 'Activo'}
          </span>
        );
      },
    },
    {
      key: 'actions',
      title: 'Acciones',
      align: 'right',
      render: (_, user: User) => {
        const isCurrentUser = user.id === currentUser?.id;
        return (
          <div className="flex items-center gap-2">
            <Button
              size="xs"
              variant="secondary"
              onClick={() => handleEditUser(user)}
            >
              Editar
            </Button>
            <Button
              size="xs"
              variant="danger"
              onClick={() => handleDeleteUser(user)}
              disabled={isCurrentUser}
              title={isCurrentUser ? 'No puedes eliminar tu propia cuenta' : undefined}
            >
              Eliminar
            </Button>
          </div>
        );
      },
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

  const UsersIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
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
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600">Administra los usuarios del sistema</p>
        </div>
        <Button
          onClick={handleCreateUser}
          leftIcon={<PlusIcon />}
        >
          Nuevo Usuario
        </Button>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-soft">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Búsqueda */}
          <Input
            placeholder="Buscar usuarios..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            leftIcon={<SearchIcon />}
          />

          {/* Filtro por rol */}
          <select
            value={roleFilter}
            onChange={(e) => handleRoleFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Todos los roles</option>
            <option value="admin">Administradores</option>
            <option value="user">Usuarios</option>
          </select>

          {/* Botón limpiar filtros */}
          <Button
            variant="ghost"
            onClick={clearFilters}
          >
            Limpiar filtros
          </Button>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      {users.length > 0 && (
        <div className="bg-white shadow-soft rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de Usuarios</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {users.length}
              </div>
              <div className="text-sm text-blue-600">Total de Usuarios</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {users.filter(user => user.role === 'admin').length}
              </div>
              <div className="text-sm text-purple-600">Administradores</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {users.filter(user => user.role === 'user').length}
              </div>
              <div className="text-sm text-green-600">Usuarios Estándar</div>
            </div>
          </div>
        </div>
      )}

      {/* Tabla */}
      <Table
        columns={columns}
        data={users}
        loading={usersLoading}
        emptyText="No se encontraron usuarios"
      />

      {/* Paginación */}
      {users.length > 0 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.limit}
          onPageChange={pagination.setPage}
          onItemsPerPageChange={pagination.setLimit}
        />
      )}

      {/* Modal crear usuario */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Crear Nuevo Usuario"
        size="lg"
      >
        <UserForm
          onSubmit={handleUserSubmit}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Modal editar usuario */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar Usuario"
        size="lg"
      >
        {selectedUser && (
          <UserForm
            user={selectedUser}
            onSubmit={handleUserSubmit}
            onCancel={() => setShowEditModal(false)}
          />
        )}
      </Modal>

      {/* Diálogo confirmar eliminación */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Eliminar Usuario"
        message={`¿Estás seguro de que quieres eliminar al usuario "${selectedUser?.username}"? Esta acción no se puede deshacer y eliminará todos los registros relacionados.`}
        confirmText="Eliminar"
        confirmVariant="danger"
        isLoading={deleteLoading}
        icon="danger"
      />
    </div>
  );
};

export default UsersPage;