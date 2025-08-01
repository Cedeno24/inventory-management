// ===============================================
// SERVICIOS DE API
// ===============================================

import axios, { AxiosResponse } from 'axios';
import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  Product,
  Category,
  InventoryMovement,
  CreateProductRequest,
  UpdateProductRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CreateUserRequest,
  UpdateUserRequest,
  ProductFilters,
  MovementFilters,
  DashboardData,
  ApiResponse,
  PaginatedResponse,
} from '../types';

// ===============================================
// CONFIGURACIÓN DEL CLIENTE AXIOS
// ===============================================
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ===============================================
// INTERCEPTOR DE REQUEST - AGREGAR TOKEN
// ===============================================
apiClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get('inventory_token');
    console.log('🔍 Interceptor request - Token encontrado:', !!token);
    console.log('🔍 URL:', config.url);
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('✅ Token agregado al header Authorization');
    } else {
      console.log('❌ No hay token para agregar');
    }
    return config;
  },
  (error) => {
    console.log('❌ Error en interceptor request:', error);
    return Promise.reject(error);
  }
);

// ===============================================
// INTERCEPTOR DE RESPONSE - MANEJAR ERRORES
// ===============================================
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('✅ Response exitoso:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.log('❌ Error en response:', error.response?.status, error.config?.url);
    
    if (error.response?.status === 401) {
      console.log('🚫 Token expirado o inválido - limpiando cookies');
      // Token expirado o inválido
      Cookies.remove('inventory_token');
      Cookies.remove('inventory_refresh_token');
      toast.error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      toast.error('No tienes permisos para realizar esta acción');
    } else if (error.response && error.response.status >= 500) {
      toast.error('Error interno del servidor');
    }
    
    return Promise.reject(error);
  }
);

// ===============================================
// SERVICIO DE SALUD
// ===============================================
export const healthService = {
  async check(): Promise<{ status: string; message: string }> {
    try {
      const response = await apiClient.get<{ status: string; message: string }>('/health');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// ===============================================
// SERVICIO DE AUTENTICACIÓN
// ===============================================
export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al iniciar sesión');
    }
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al crear la cuenta');
    }
  },

  async getProfile(): Promise<User> {
    try {
      const response = await apiClient.get<ApiResponse<{ user: User }>>('/auth/profile');
      return response.data.data!.user;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener el perfil');
    }
  },

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const response = await apiClient.post<{ accessToken: string }>('/auth/refresh', { refreshToken });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al renovar el token');
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Ignorar errores de logout
    }
  },
};

// ===============================================
// SERVICIO DE PRODUCTOS
// ===============================================
export const productService = {
  async getProducts(filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
      
      const response = await apiClient.get<PaginatedResponse<Product>>(`/products?${params}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener productos');
    }
  },

  async getProduct(id: number): Promise<Product> {
    try {
      const response = await apiClient.get<ApiResponse<{ product: Product }>>(`/products/${id}`);
      return response.data.data!.product;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener el producto');
    }
  },

  async createProduct(data: CreateProductRequest): Promise<Product> {
    try {
      const response = await apiClient.post<ApiResponse<{ product: Product }>>('/products', data);
      return response.data.data!.product;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al crear el producto');
    }
  },

  async updateProduct(id: number, data: UpdateProductRequest): Promise<Product> {
    try {
      const response = await apiClient.put<ApiResponse<{ product: Product }>>(`/products/${id}`, data);
      return response.data.data!.product;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al actualizar el producto');
    }
  },

  async deleteProduct(id: number): Promise<boolean> {
    try {
      await apiClient.delete(`/products/${id}`);
      return true;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al eliminar el producto');
    }
  },

  async getLowStockProducts(): Promise<Product[]> {
    try {
      const response = await apiClient.get<ApiResponse<{ products: Product[] }>>('/products/reports/low-stock');
      return response.data.data!.products;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener productos con stock bajo');
    }
  },
};

// ===============================================
// SERVICIO DE CATEGORÍAS
// ===============================================
export const categoryService = {
  async getCategories(includeStats = false): Promise<Category[]> {
    try {
      const params = includeStats ? '?include_stats=true' : '';
      const response = await apiClient.get<ApiResponse<{ categories: Category[] }>>(`/categories${params}`);
      return response.data.data!.categories;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener categorías');
    }
  },

  async getCategory(id: number): Promise<Category> {
    try {
      const response = await apiClient.get<ApiResponse<{ category: Category }>>(`/categories/${id}`);
      return response.data.data!.category;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener la categoría');
    }
  },

  async createCategory(data: CreateCategoryRequest): Promise<Category> {
    try {
      const response = await apiClient.post<ApiResponse<{ category: Category }>>('/categories', data);
      return response.data.data!.category;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al crear la categoría');
    }
  },

  async updateCategory(id: number, data: UpdateCategoryRequest): Promise<Category> {
    try {
      const response = await apiClient.put<ApiResponse<{ category: Category }>>(`/categories/${id}`, data);
      return response.data.data!.category;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al actualizar la categoría');
    }
  },

  async deleteCategory(id: number): Promise<boolean> {
    try {
      await apiClient.delete(`/categories/${id}`);
      return true;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al eliminar la categoría');
    }
  },
};

// ===============================================
// SERVICIO DE USUARIOS
// ===============================================
export const userService = {
  async getUsers(filters: any = {}): Promise<PaginatedResponse<User>> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
      
      const response = await apiClient.get<PaginatedResponse<User>>(`/users?${params}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener usuarios');
    }
  },

  async getUser(id: number): Promise<User> {
    try {
      const response = await apiClient.get<ApiResponse<{ user: User }>>(`/users/${id}`);
      return response.data.data!.user;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener el usuario');
    }
  },

  async createUser(data: CreateUserRequest): Promise<User> {
    try {
      const response = await apiClient.post<ApiResponse<{ user: User }>>('/users', data);
      return response.data.data!.user;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al crear el usuario');
    }
  },

  async updateUser(id: number, data: UpdateUserRequest): Promise<User> {
    try {
      const response = await apiClient.put<ApiResponse<{ user: User }>>(`/users/${id}`, data);
      return response.data.data!.user;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al actualizar el usuario');
    }
  },

  async deleteUser(id: number): Promise<boolean> {
    try {
      await apiClient.delete(`/users/${id}`);
      return true;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al eliminar el usuario');
    }
  },
};

// ===============================================
// SERVICIO DE INVENTARIO
// ===============================================
// ===============================================
// SERVICIO DE INVENTARIO
// ===============================================
export const inventoryService = {
  async getMovements(filters: MovementFilters = {}): Promise<PaginatedResponse<InventoryMovement>> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });
      
      const response = await apiClient.get<PaginatedResponse<InventoryMovement>>(`/inventory/movements?${params}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener movimientos');
    }
  },

  async createMovement(data: {
    product_id: number;
    movement_type: string;
    quantity_changed: number;
    reason?: string;
    notes?: string;
  }): Promise<InventoryMovement> {
    try {
      const response = await apiClient.post<ApiResponse<{ movement: InventoryMovement }>>('/inventory/movements', data);
      return response.data.data!.movement;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al crear el movimiento');
    }
  },
};

// ===============================================
// SERVICIO DE REPORTES Y DASHBOARD
// ===============================================
export const dashboardService = {
  async getDashboardData(): Promise<DashboardData> {
    try {
      const response = await apiClient.get<ApiResponse<DashboardData>>('/reports/dashboard');
      return response.data.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener datos del dashboard');
    }
  },
};

// ===============================================
// SERVICIO DE REPORTES
// ===============================================
export const reportService = {
  async getDashboard(): Promise<DashboardData> {
    try {
      const response = await apiClient.get<ApiResponse<DashboardData>>('/reports/dashboard');
      return response.data.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener el dashboard');
    }
  },

  async getInventoryReport(): Promise<any> {
    try {
      const response = await apiClient.get<ApiResponse<any>>('/reports/inventory');
      return response.data.data!;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener el reporte de inventario');
    }
  },
};

// ===============================================
// EXPORTAR SERVICIOS
// ===============================================
export default {
  health: healthService,
  auth: authService,
  products: productService,
  categories: categoryService,
  users: userService,
  inventory: inventoryService,
  dashboard: dashboardService,
  reports: reportService,
};