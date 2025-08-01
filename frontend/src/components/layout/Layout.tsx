// ===============================================
// PASO CORREGIDO - frontend/src/components/layout/Layout.tsx
// COMPONENTE LAYOUT PRINCIPAL - NAVEGACIÓN CORREGIDA
// ===============================================

import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

// ===============================================
// TIPOS Y INTERFACES
// ===============================================
interface LayoutProps {
  // Removemos children ya que usaremos solo Outlet para rutas anidadas
}

// ===============================================
// COMPONENTE PRINCIPAL - CORREGIDO
// ===============================================
const Layout: React.FC<LayoutProps> = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Función para cerrar sidebar
  const handleCloseSidebar = () => {
    setSidebarOpen(false);
  };

  // Función para abrir sidebar
  const handleOpenSidebar = () => {
    setSidebarOpen(true);
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sidebar Component */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={handleCloseSidebar} 
      />

      {/* Main content area */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Header Component */}
        <Header onMenuClick={handleOpenSidebar} />

        {/* Page content - CORREGIDO: Solo usar Outlet para rutas anidadas */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* 
                CORRECCIÓN CRÍTICA: 
                Usar solo <Outlet /> para renderizar las rutas anidadas.
                Esto resuelve el problema de navegación.
              */}
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;