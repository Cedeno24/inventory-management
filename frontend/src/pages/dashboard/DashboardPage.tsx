// ===============================================
// DashboardPage.tsx - CON DATOS REALES
// ===============================================

import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { productService, categoryService, userService } from '../../services/api';
import { formatCurrency, formatNumber, formatRelativeTime } from '../../utils/formatters';

// ===============================================
// TIPOS
// ===============================================
interface DashboardStats {
  total_products: number;
  total_categories: number;
  total_users: number;
  total_inventory_value: number;
  low_stock_products: number;
}

interface SimpleDashboardData {
  stats: DashboardStats;
  low_stock_products: any[];
  recent_movements: any[];
}

// ===============================================
// COMPONENTE PRINCIPAL
// ===============================================
const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<SimpleDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ===============================================
  // FUNCIÓN PARA CARGAR DATOS REALES
  // ===============================================
  const loadDashboardData = useCallback(async () => {
    console.log('🔄 Cargando datos del dashboard...');
    setLoading(true);
    setError(null);

    try {
      // Cargar datos en paralelo
      const [productsResponse, categoriesResponse] = await Promise.all([
        productService.getProducts({ limit: 1000 }), // Todos los productos
        categoryService.getCategories(), // Todas las categorías
      ]);

      console.log('📦 Respuesta productos:', productsResponse);
      console.log('📁 Respuesta categorías:', categoriesResponse);

      // Extraer productos de la respuesta
      let products: any[] = [];
      if (productsResponse?.data) {
        const productsKey = Object.keys(productsResponse.data).find(key => 
          Array.isArray(productsResponse.data[key])
        );
        if (productsKey) {
          products = productsResponse.data[productsKey];
        }
      }

      // Extraer categorías
      const categories = Array.isArray(categoriesResponse) ? categoriesResponse : [];

      console.log('✅ Productos procesados:', products.length);
      console.log('✅ Categorías procesadas:', categories.length);

      // Calcular estadísticas
      const totalProducts = products.length;
      const totalCategories = categories.length;
      const totalUsers = 1; // Por ahora usar 1, se puede mejorar después

      // Calcular valor total del inventario
      const totalInventoryValue = products.reduce((sum, product) => {
        const price = parseFloat(product.price) || 0;
        const quantity = parseInt(product.quantity) || 0;
        return sum + (price * quantity);
      }, 0);

      // Encontrar productos con stock bajo
      const lowStockProducts = products.filter(product => {
        const quantity = parseInt(product.quantity) || 0;
        const minStock = parseInt(product.min_stock) || 0;
        return quantity <= minStock;
      });

      const stats: DashboardStats = {
        total_products: totalProducts,
        total_categories: totalCategories,
        total_users: totalUsers,
        total_inventory_value: totalInventoryValue,
        low_stock_products: lowStockProducts.length,
      };

      const data: SimpleDashboardData = {
        stats,
        low_stock_products: lowStockProducts.slice(0, 5), // Solo los primeros 5
        recent_movements: [], // Por ahora vacío
      };

      console.log('📊 Estadísticas calculadas:', stats);
      setDashboardData(data);

    } catch (error: any) {
      console.error('❌ Error cargando dashboard:', error);
      setError(error.message || 'Error al cargar los datos del dashboard');
      toast.error('Error al cargar el dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  // ===============================================
  // EFECTO PARA CARGAR DATOS
  // ===============================================
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

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
      blue: 'bg-blue-50 text-blue-600',
      green: 'bg-green-50 text-green-600', 
      yellow: 'bg-yellow-50 text-yellow-600',
      red: 'bg-red-50 text-red-600',
      purple: 'bg-purple-50 text-purple-600',
    };

    return (
      <div className="bg-white overflow-hidden shadow-soft rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`inline-flex items-center justify-center p-3 rounded-md ${colorClasses[color]}`}>
                {icon}
              </div>
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  {title}
                </dt>
                <dd className="text-lg font-semibold text-gray-900">
                  {typeof value === 'number' ? formatNumber(value) : value}
                </dd>
                {description && (
                  <dd className="text-sm text-gray-500">
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
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );

  const CategoriesIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );

  const UsersIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  );

  const MoneyIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
    </svg>
  );

  const WarningIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          onClick={loadDashboardData}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Reintentar
        </button>
      </div>
    );
  }

  // ===============================================
  // RENDER SIN DATOS
  // ===============================================
  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">No hay datos disponibles</p>
        <button
          onClick={loadDashboardData}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          Cargar datos
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
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Productos"
          value={dashboardData.stats.total_products}
          icon={<ProductsIcon />}
          color="blue"
          description={dashboardData.stats.total_products === 1 ? 'producto registrado' : 'productos registrados'}
        />
        <StatCard
          title="Categorías"
          value={dashboardData.stats.total_categories}
          icon={<CategoriesIcon />}
          color="green"
          description={dashboardData.stats.total_categories === 1 ? 'categoría disponible' : 'categorías disponibles'}
        />
        <StatCard
          title="Usuarios"
          value={dashboardData.stats.total_users}
          icon={<UsersIcon />}
          color="purple"
          description="usuario del sistema"
        />
        <StatCard
          title="Valor Total"
          value={formatCurrency(dashboardData.stats.total_inventory_value)}
          icon={<MoneyIcon />}
          color="yellow"
          description="valor del inventario"
        />
      </div>

      {/* Alertas de stock bajo */}
      {dashboardData.stats.low_stock_products > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <WarningIcon />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Atención:</strong> Tienes {dashboardData.stats.low_stock_products} producto{dashboardData.stats.low_stock_products > 1 ? 's' : ''} con stock bajo.
                <Link 
                  to="/products" 
                  className="font-medium underline text-yellow-700 hover:text-yellow-600 ml-1"
                >
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
        {dashboardData.low_stock_products.length > 0 && (
          <div className="bg-white shadow-soft rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Productos con Stock Bajo
              </h3>
              <div className="space-y-3">
                {dashboardData.low_stock_products.map((product) => (
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
              {dashboardData.stats.low_stock_products > 5 && (
                <div className="mt-4">
                  <Link
                    to="/products?filter=low_stock"
                    className="text-sm text-primary-600 hover:text-primary-500 font-medium"
                  >
                    Ver todos ({dashboardData.stats.low_stock_products})
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Acceso rápido */}
        <div className="bg-white shadow-soft rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Acceso Rápido
            </h3>
            <div className="space-y-3">
              <Link
                to="/products"
                className="flex items-center justify-between py-2 px-3 text-sm text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <ProductsIcon />
                  <span className="ml-3">Ver todos los productos</span>
                </div>
                <span className="text-gray-400">→</span>
              </Link>
              
              <Link
                to="/categories"
                className="flex items-center justify-between py-2 px-3 text-sm text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <CategoriesIcon />
                  <span className="ml-3">Gestionar categorías</span>
                </div>
                <span className="text-gray-400">→</span>
              </Link>
              
              <Link
                to="/inventory"
                className="flex items-center justify-between py-2 px-3 text-sm text-gray-900 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <MoneyIcon />
                  <span className="ml-3">Ver movimientos</span>
                </div>
                <span className="text-gray-400">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;