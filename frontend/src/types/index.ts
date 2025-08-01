// ===============================================
// TIPOS Y INTERFACES PRINCIPALES
// ===============================================

// ===============================================
// USUARIO
// ===============================================
export interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
  updated_at: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  password?: string;
  role?: 'admin' | 'user';
}

// ===============================================
// AUTENTICACIÓN
// ===============================================
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user: User;
  accessToken: string;
  refreshToken: string;
}

// ===============================================
// CATEGORÍA
// ===============================================
export interface Category {
  id: number;
  name: string;
  description: string;
  product_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCategoryRequest {
  name: string;
  description: string;
}

export interface UpdateCategoryRequest extends CreateCategoryRequest {
  id: number;
}

// ===============================================
// PRODUCTO
// ===============================================
export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  min_stock: number;
  category_id: number;
  category_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProductRequest {
  name: string;
  description: string;
  price: number;
  quantity: number;
  min_stock: number;
  category_id: number;
}

export interface UpdateProductRequest extends CreateProductRequest {
  id: number;
}

// ===============================================
// MOVIMIENTOS DE INVENTARIO
// ===============================================
export interface InventoryMovement {
  id: number;
  product_id: number;
  product_name?: string;
  category_name?: string;
  user_id: number;
  username?: string;
  movement_type: 'CREATE' | 'UPDATE' | 'DELETE' | 'STOCK_IN' | 'STOCK_OUT';
  quantity_before?: number;
  quantity_after?: number;
  quantity_changed: number;
  reason?: string;
  notes?: string;
  created_at: string;
}

// ===============================================
// REPORTES Y ESTADÍSTICAS
// ===============================================
export interface DashboardStats {
  total_products: number;
  total_categories: number;
  total_users: number;
  total_inventory_value: number;
  low_stock_products: number;
}

export interface CategoryDistribution {
  name: string;
  product_count: number;
  total_quantity: number;
  total_value: number;
}

export interface DashboardData {
  stats: DashboardStats;
  low_stock_products: Product[];
  valuable_products: Product[];
  category_distribution: CategoryDistribution[];
  recent_movements: InventoryMovement[];
}

// ===============================================
// API RESPONSES
// ===============================================
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Array<{
    msg: string;
    param: string;
    value: any;
  }>;
}

export interface PaginationMeta {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message?: string;
  data: {
    [K in string]: T[];
  } & {
    pagination: PaginationMeta;
    filters?: Record<string, any>;
  };
  error?: string;
}

// ===============================================
// FILTROS Y BÚSQUEDA
// ===============================================
export interface ProductFilters {
  search?: string;
  category_id?: number;
  stock_status?: 'LOW' | 'MEDIUM' | 'HIGH';
  page?: number;
  limit?: number;
}

export interface MovementFilters {
  product_id?: number;
  movement_type?: string;
  page?: number;
  limit?: number;
}

// ===============================================
// FORMULARIOS
// ===============================================
export interface FormErrors {
  [key: string]: string | undefined;
}

// ===============================================
// ESTADOS DE LA APLICACIÓN
// ===============================================
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// ===============================================
// PROPS COMUNES
// ===============================================
export interface ChildrenProps {
  children: React.ReactNode;
}

export interface ClassNameProps {
  className?: string;
}

export interface LoadingProps {
  isLoading?: boolean;
}

// ===============================================
// CONFIGURACIÓN
// ===============================================
export interface AppConfig {
  apiUrl: string;
  appName: string;
  version: string;
  environment: string;
  defaultPageSize: number;
  maxPageSize: number;
}