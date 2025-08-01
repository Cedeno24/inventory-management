// ===============================================
// PASO CORREGIDO - frontend/src/components/layout/Sidebar.tsx
// COMPONENTE SIDEBAR - NAVEGACIÓN CORREGIDA
// ===============================================

import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import clsx from 'clsx';

// ===============================================
// TIPOS Y INTERFACES
// ===============================================
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  current?: boolean;
}

// ===============================================
// ICONOS SVG - SIMPLIFICADOS PARA MEJOR RENDIMIENTO
// ===============================================
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6a2 2 0 01-2 2H10a2 2 0 01-2-2V5z" />
  </svg>
);

const ProductsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const CategoriesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const InventoryIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

// ===============================================
// NAVEGACIÓN - RUTAS CORREGIDAS
// ===============================================
const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: <DashboardIcon /> },
  { name: 'Productos', href: '/products', icon: <ProductsIcon /> },
  { name: 'Categorías', href: '/categories', icon: <CategoriesIcon /> },
  { name: 'Inventario', href: '/inventory', icon: <InventoryIcon /> },
  { name: 'Usuarios', href: '/users', icon: <UsersIcon /> },
];

// ===============================================
// COMPONENTE PRINCIPAL - CORREGIDO
// ===============================================
const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();

  // ===============================================
  // COMPONENTE DE NAVEGACIÓN - SIMPLIFICADO
  // ===============================================
  const Navigation = () => (
    <nav className="mt-8 flex-1 px-2 space-y-1">
      {navigation.map((item) => {
        // Lógica simplificada para determinar si está activo
        const isCurrentRoute = location.pathname === item.href || 
                              (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
        
        return (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              clsx(
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-all duration-200',
                // Usar isActive de NavLink como fuente principal de verdad
                isActive || isCurrentRoute
                  ? 'bg-primary-100 text-primary-900 border-r-2 border-primary-600 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
              )
            }
            onClick={(e) => {
              // Asegurar que el click funcione correctamente
              console.log(`Navegando a: ${item.href}`);
              onClose(); // Cerrar sidebar en mobile
            }}
          >
            <span
              className={clsx(
                'mr-3 flex-shrink-0 transition-colors duration-200',
                isCurrentRoute 
                  ? 'text-primary-600' 
                  : 'text-gray-400 group-hover:text-gray-500'
              )}
            >
              {item.icon}
            </span>
            <span className="truncate">{item.name}</span>
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile sidebar overlay */}
      <div
        className={clsx(
          'fixed inset-0 flex z-40 md:hidden transition-opacity duration-300',
          isOpen 
            ? 'opacity-100 pointer-events-auto' 
            : 'opacity-0 pointer-events-none'
        )}
      >
        {/* Overlay background */}
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
        
        {/* Sidebar panel */}
        <div
          className={clsx(
            'relative flex-1 flex flex-col max-w-xs w-full bg-white transform transition-transform duration-300 ease-in-out',
            isOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {/* Close button */}
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={onClose}
            >
              <span className="sr-only">Cerrar sidebar</span>
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Sidebar content */}
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <h1 className="text-xl font-bold text-gray-900">
                Sistema de Inventario
              </h1>
            </div>
            <Navigation />
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <h1 className="text-xl font-bold text-gray-900">
                  Sistema de Inventario
                </h1>
              </div>
              <Navigation />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;