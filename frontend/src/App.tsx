// ===============================================
// PASO CORREGIDO - frontend/src/App.tsx
// COMPONENTE PRINCIPAL DE LA APLICACIÓN - NAVEGACIÓN CORREGIDA
// ===============================================

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProductsPage from './pages/products/ProductsPage';
import ProductDetailPage from './pages/products/ProductDetailPage';
import CategoriesPage from './pages/categories/CategoriesPage';
import InventoryPage from './pages/inventory/InventoryPage';
import UsersPage from './pages/users/UsersPage';

// ===============================================
// COMPONENTE PRINCIPAL
// ===============================================
function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          {/* Configuración de Toast */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#374151',
                border: '1px solid #e5e7eb',
                borderRadius: '0.75rem',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />

          {/* Rutas de la aplicación */}
          <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Rutas protegidas con Layout como contenedor */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              {/* Redirigir raíz a dashboard */}
              <Route index element={<Navigate to="/dashboard" replace />} />
              
              {/* Dashboard */}
              <Route path="dashboard" element={<DashboardPage />} />
              
              {/* Productos */}
              <Route path="products" element={<ProductsPage />} />
              <Route path="products/:id" element={<ProductDetailPage />} />
              
              {/* Categorías */}
              <Route path="categories" element={<CategoriesPage />} />
              
              {/* Inventario */}
              <Route path="inventory" element={<InventoryPage />} />
              
              {/* Usuarios (solo admin) */}
              <Route 
                path="users" 
                element={
                  <ProtectedRoute requiredRole="admin">
                    <UsersPage />
                  </ProtectedRoute>
                } 
              />
            </Route>

            {/* Ruta 404 - Página no encontrada */}
            <Route 
              path="*" 
              element={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                      <svg 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 48 48" 
                        aria-hidden="true"
                        className="h-12 w-12"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M34 14l-20 20m0-20l20 20" 
                        />
                      </svg>
                    </div>
                    <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                    <p className="text-xl text-gray-600 mb-8">Página no encontrada</p>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-500 mb-4">
                        La página que buscas no existe o ha sido movida.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button
                          onClick={() => window.history.back()}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                          </svg>
                          Volver
                        </button>
                        <a
                          href="/dashboard"
                          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          Ir al Dashboard
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              } 
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;