// ===============================================
// SERVICIO DE API
// ===============================================

import axios, { AxiosResponse, AxiosError } from 'axios';
import Cookies from 'js-cookie';
import { toast } from 'react-hot-toast';
import { 
  ApiResponse, 
  PaginatedResponse,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  DashboardData,
  ProductFilters,
  MovementFilters
} from '../types';

// ===============================================
// CONFIGURACIÓN BASE
// ===============================================
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// Crear instancia de axios
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ===============================================
// INTERCEPTORES
// ===============================================

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = Cookies.get('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url}`, response.data);
    }
    return response;
  },
  (error: AxiosError) => {
    console.error('❌ Response error:', error.response?.data || error.message);
    
    // Manejar errores específicos
    if (error.response?.status === 401) {
      console.log('🔒 Token inválido o expirado');
      // Remover tokens inválidos
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
      // Redirigir al login si no estamos ya ahí
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      toast.error('No tienes permisos para realizar esta acción');
    } else if (error.response?.status >= 500) {
      toast.error('Error interno del servidor');
    }
    
    return Promise.reject(error);
  }
);

// ===============================================
// FUNCIONES AUXILIARES
// ===============================================
const handleApiError = (error: any): never => {
  const message = error.response?.data?.message || error.message || 'Error desconocido';
  throw new Error(message);
};

// ===============================================
// SERVICIOS DE AUTENTICACIÓN
// ===============================================
export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/auth/register', data);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  async getProfile(): Promise<User> {
    try {
      const response = await apiClient.get<ApiResponse<{ user: User }>>('/auth/profile');
      return response.data.data!.user;
    } catch (error) {
      handleApiError(error);
    }
  },

  async verifyToken(): Promise<boolean> {
    try {
      await apiClient.get('/auth/verify-token');
      return true;
    } catch (error) {
      return false;
    }
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Incluso si falla el logout en el servidor, limpiamos local
      console.warn('Error en logout del servidor:', error);
    } finally {
      Cookies.remove('accessToken');
      Cookies.remove('refreshToken');
    }
  }
};

// ===============================================
// SERVICIOS DE PRODUCTOS
// ===============================================
export const productService = {
  async getProducts(filters: ProductFilters = {}): Promise<PaginatedResponse<Product>> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
      
      const response = await apiClient.get<PaginatedResponse<Product>>(`/products?${params}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  async getProduct(id: number): Promise<Product> {
    try {
      const response = await apiClient.get<ApiResponse<{ product: Product }>>(`/products/${id}`);
      return response.data.data!.product;
    } catch (error) {
      handleApiError(error);
    }
  },

  async createProduct(data: CreateProductRequest): Promise<Product> {
    try {
      const response = await apiClient.post<ApiResponse<{ product: Product }>>('/products', data);
      return response.data.data!.product;
    } catch (error) {
      handleApiError(error);
    }
  },

  async updateProduct(id: number, data: UpdateProductRequest): Promise<Product> {
    try {
      const response = await apiClient.put<ApiResponse<{ product: Product }>>(`/products/${id}`, data);
      return response.data.data!.product;
    } catch (error) {
      handleApiError(error);
    }
  },

  async deleteProduct(id: number): Promise<void> {
    try {
      await apiClient.delete(`/products/${id}`);
    } catch (error) {
      handleApiError(error);
    }
  },

  async getLowStockProducts(): Promise<Product[]> {
    try {
      const response = await apiClient.get<ApiResponse<{ products: Product[] }>>('/products/reports/low-stock');
      return response.data.data!.products;
    } catch (error) {
      handleApiError(error);
    }
  }
};

// ===============================================
// SERVICIOS DE CATEGORÍAS
// ===============================================
export const categoryService = {
  async getCategories(includeStats = false): Promise<Category[]> {
    try {
      const params = includeStats ? '?include_stats=true' : '';
      const response = await apiClient.get<ApiResponse<{ categories: Category[] }>>(`/categories${params}`);
      return response.data.data!.categories;
    } catch (error) {
      handleApiError(error);
    }
  },

  async getCategory(id: number): Promise<Category> {
    try {
      const response = await apiClient.get<ApiResponse<{ category: Category }>>(`/categories/${id}`);
      return response.data.data!.category;
    } catch (error) {
      handleApiError(error);
    }
  },

  async createCategory(data: CreateCategoryRequest): Promise<Category> {
    try {
      const response = await apiClient.post<ApiResponse<{ category: Category }>>('/categories', data);
      return response.data.data!.category;
    } catch (error) {
      handleApiError(error);
    }
  },

  async updateCategory(id: number, data: UpdateCategoryRequest): Promise<Category> {
    try {
      const response = await apiClient.put<ApiResponse<{ category: Category }>>(`/categories/${id}`, data);
      return response.data.data!.category;
    } catch (error) {
      handleApiError(error);
    }
  },

  async deleteCategory(id: number): Promise<void> {
    try {
      await apiClient.delete(`/categories/${id}`);
    } catch (error) {
      handleApiError(error);
    }
  }
};

// ===============================================
// SERVICIOS DE REPORTES
// ===============================================
export const reportService = {
  async getDashboard(): Promise<DashboardData> {
    try {
      const response = await apiClient.get<ApiResponse<DashboardData>>('/reports/dashboard');
      return response.data.data!;
    } catch (error) {
      handleApiError(error);
    }
  },

  async getInventoryReport(filters: any = {}): Promise<any> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
      
      const response = await apiClient.get(`/reports/inventory?${params}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  async getMovements(filters: MovementFilters = {}): Promise<any> {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
      
      const response = await apiClient.get(`/reports/movements?${params}`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  }
};

// ===============================================
// SERVICIO GENERAL
// ===============================================
export const healthService = {
  async checkHealth(): Promise<boolean> {
    try {
      const response = await axios.get(`${API_BASE_URL.replace('/api/v1', '')}/health`);
      return response.data.status === 'OK';
    } catch (error) {
      return false;
    }
  }
};

// Exportar instancia de axios para uso directo si es necesario
export { apiClient };
export default apiClient;