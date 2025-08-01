// ===============================================
// PASO 9.20 - frontend/src/pages/dashboard/DashboardPage.tsx
// PÁGINA PRINCIPAL DEL DASHBOARD
// ===============================================

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import { useApi } from '../../hooks/useApi';
import { dashboardService } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { DashboardData } from '../../types';
import { formatCurrency, formatNumber, formatRelativeTime } from '../../utils/formatters';

// ===============================================
// COMPONENTE PRINCIPAL
// ===============================================
const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  
  const {
    data,
    loading,
    error,
    execute: fetchDashboardData
  } = useApi(dashboardService.getDashboardData, {
    showErrorToast: true,
  });

  // ===============================================
  // EFECTOS
  // ===============================================
  useEffect(() => {
    const loadDashboardData = async () => {
      const result = await fetchDashboardData();
      if (result) {
        setDashboardData(result);
      }
    };

    loadDashboardData();
  }, []);

  // ===============================================
  // COMPONENTE DE ESTADÍSTICA
  // ===============================================
  const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: React.ReactNode;
    color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
    description?: string;
  }> = ({ title, value, icon, color, description }) => {
    const colorClasses = {
      blue: 'bg-blue-500 text-blue-600 bg-blue-100',
      green: 'bg-green-500 text-green-600 bg-green-100',
      yellow: 'bg-yellow-500 text-yellow-600 bg-yellow-100',
      red: 'bg-red-500 text-red-600 bg-red-100',
      purple: 'bg-purple-500 text-purple-600 bg-purple-100',
    };

    return (
      <div className="bg-white overflow-hidden shadow-soft rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-md flex items-center justify-center ${colorClasses[color].split(' ')[2]}`}>
                <div className={`w-5 h-5 ${colorClasses[color].split(' ')[1]}`}>
                  {icon}
                </div>
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  {title}
                </dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {value}
                </dd>
                {description && (
                  <dd className="text-sm text-gray-600">
                    {description}
                  </dd>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ===============================================
  // ICONOS
  // ===============================================
  const ProductsIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );

  const CategoriesIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );

  const UsersIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  );

  const MoneyIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const WarningIcon = () => (
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
  );

  // ===============================================
  // RENDER LOADING
  // ===============================================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Cargando dashboard..." />
      </div>
    );
  }

  // ===============================================
  // RENDER ERROR
  // ===============================================
  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <WarningIcon />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Error al cargar el dashboard
        </h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => fetchDashboardData()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // ===============================================
  // RENDER PRINCIPAL
  // ===============================================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          ¡Bienvenido, {user?.username}!
        </h1>
        <p className="text-gray-600">
          Aquí tienes un resumen de tu inventario
        </p>
      </div>

      {/* Estadísticas principales */}
      {dashboardData && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Productos"
            value={formatNumber(dashboardData.stats.total_products)}
            icon={<ProductsIcon />}
            color="blue"
          />
          <StatCard
            title="Categorías"
            value={formatNumber(dashboardData.stats.total_categories)}
            icon={<CategoriesIcon />}
            color="green"
          />
          <StatCard
            title="Usuarios"
            value={formatNumber(dashboardData.stats.total_users)}
            icon={<UsersIcon />}
            color="purple"
          />
          <StatCard
            title="Valor Total"
            value={formatCurrency(dashboardData.stats.total_inventory_value)}
            icon={<MoneyIcon />}
            color="yellow"
          />
        </div>
      )}

      {/* Alertas de stock bajo */}
      {dashboardData && dashboardData.stats.low_stock_products > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <WarningIcon />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Atención:</strong> Tienes {dashboardData.stats.low_stock_products} producto{dashboardData.stats.low_stock_products > 1 ? 's' : ''} con stock bajo.
                <Link to="/products" className="font-medium underline text-yellow-700 hover:text-yellow-600 ml-1">
                  Ver productos
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Grid de contenido */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productos de bajo stock */}
        {dashboardData && dashboardData.low_stock_products.length > 0 && (
          <div className="bg-white shadow-soft rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Productos con Stock Bajo
              </h3>
              <div className="space-y-3">
                {dashboardData.low_stock_products.slice(0, 5).map((product) => (
                  <div key={product.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Stock: {product.quantity} | Mín: {product.min_stock}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Bajo
                    </span>
                  </div>
                ))}
              </div>
              {dashboardData.low_stock_products.length > 5 && (
                <div className="mt-4">
                  <Link
                    to="/products?filter=low_stock"
                    className="text-sm text-primary-600 hover:text-primary-500 font-medium"
                  >
                    Ver todos ({dashboardData.low_stock_products.length})
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Movimientos recientes */}
        {dashboardData && dashboardData.recent_movements.length > 0 && (
          <div className="bg-white shadow-soft rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Movimientos Recientes
              </h3>
              <div className="space-y-3">
                {dashboardData.recent_movements.slice(0, 5).map((movement) => (
                  <div key={movement.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {movement.product_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {movement.movement_type} • {formatRelativeTime(movement.created_at)}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      movement.movement_type === 'STOCK_IN' ? 'bg-green-100 text-green-800' :
                      movement.movement_type === 'STOCK_OUT' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {movement.quantity_changed > 0 ? '+' : ''}{movement.quantity_changed}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Link
                  to="/inventory"
                  className="text-sm text-primary-600 hover:text-primary-500 font-medium"
                >
                  Ver historial completo
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;