// ===============================================
// PASO 9.13 - frontend/src/utils/constants.ts
// CONSTANTES DE LA APLICACIÓN
// ===============================================

// ===============================================
// CONFIGURACIÓN DE LA API
// ===============================================
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1',
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
} as const;

// ===============================================
// CONFIGURACIÓN DE AUTENTICACIÓN
// ===============================================
export const AUTH_CONFIG = {
  TOKEN_KEY: process.env.REACT_APP_TOKEN_STORAGE_KEY || 'inventory_token',
  REFRESH_TOKEN_KEY: process.env.REACT_APP_REFRESH_TOKEN_STORAGE_KEY || 'inventory_refresh_token',
  TOKEN_EXPIRY_BUFFER: 5 * 60 * 1000, // 5 minutos en ms
} as const;

// ===============================================
// CONFIGURACIÓN DE PAGINACIÓN
// ===============================================
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: Number(process.env.REACT_APP_DEFAULT_PAGE_SIZE) || 20,
  MAX_PAGE_SIZE: Number(process.env.REACT_APP_MAX_PAGE_SIZE) || 100,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
} as const;

// ===============================================
// ROLES DE USUARIO
// ===============================================
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
} as const;

// ===============================================
// ESTADOS DE STOCK
// ===============================================
export const STOCK_STATUS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const;

export const STOCK_STATUS_LABELS = {
  [STOCK_STATUS.LOW]: 'Stock Bajo',
  [STOCK_STATUS.MEDIUM]: 'Stock Medio',
  [STOCK_STATUS.HIGH]: 'Stock Alto',
} as const;

export const STOCK_STATUS_COLORS = {
  [STOCK_STATUS.LOW]: 'danger',
  [STOCK_STATUS.MEDIUM]: 'warning',
  [STOCK_STATUS.HIGH]: 'success',
} as const;

// ===============================================
// TIPOS DE MOVIMIENTO
// ===============================================
export const MOVEMENT_TYPES = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  STOCK_IN: 'STOCK_IN',
  STOCK_OUT: 'STOCK_OUT',
} as const;

export const MOVEMENT_TYPE_LABELS = {
  [MOVEMENT_TYPES.CREATE]: 'Producto Creado',
  [MOVEMENT_TYPES.UPDATE]: 'Producto Actualizado',
  [MOVEMENT_TYPES.DELETE]: 'Producto Eliminado',
  [MOVEMENT_TYPES.STOCK_IN]: 'Entrada de Stock',
  [MOVEMENT_TYPES.STOCK_OUT]: 'Salida de Stock',
} as const;

export const MOVEMENT_TYPE_COLORS = {
  [MOVEMENT_TYPES.CREATE]: 'success',
  [MOVEMENT_TYPES.UPDATE]: 'warning',
  [MOVEMENT_TYPES.DELETE]: 'danger',
  [MOVEMENT_TYPES.STOCK_IN]: 'primary',
  [MOVEMENT_TYPES.STOCK_OUT]: 'secondary',
} as const;

// ===============================================
// RUTAS DE LA APLICACIÓN
// ===============================================
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: '/products/:id',
  CATEGORIES: '/categories',
  INVENTORY: '/inventory',
  USERS: '/users',
  PROFILE: '/profile',
} as const;

// ===============================================
// MENSAJES DE ERROR
// ===============================================
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Error de conexión. Verifica tu conexión a internet.',
  UNAUTHORIZED: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
  FORBIDDEN: 'No tienes permisos para realizar esta acción.',
  NOT_FOUND: 'El recurso solicitado no fue encontrado.',
  SERVER_ERROR: 'Error interno del servidor. Inténtalo más tarde.',
  VALIDATION_ERROR: 'Los datos proporcionados no son válidos.',
  UNKNOWN_ERROR: 'Ha ocurrido un error inesperado.',
} as const;

// ===============================================
// MENSAJES DE ÉXITO
// ===============================================
export const SUCCESS_MESSAGES = {
  LOGIN: '¡Bienvenido de vuelta!',
  LOGOUT: 'Sesión cerrada exitosamente.',
  REGISTER: 'Cuenta creada exitosamente.',
  PRODUCT_CREATED: 'Producto creado exitosamente.',
  PRODUCT_UPDATED: 'Producto actualizado exitosamente.',
  PRODUCT_DELETED: 'Producto eliminado exitosamente.',
  CATEGORY_CREATED: 'Categoría creada exitosamente.',
  CATEGORY_UPDATED: 'Categoría actualizada exitosamente.',
  CATEGORY_DELETED: 'Categoría eliminada exitosamente.',
  USER_CREATED: 'Usuario creado exitosamente.',
  USER_UPDATED: 'Usuario actualizado exitosamente.',
  USER_DELETED: 'Usuario eliminado exitosamente.',
  PROFILE_UPDATED: 'Perfil actualizado exitosamente.',
} as const;

// ===============================================
// CONFIGURACIÓN DE ARCHIVOS
// ===============================================
export const FILE_CONFIG = {
  MAX_SIZE: Number(process.env.REACT_APP_MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: process.env.REACT_APP_ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
} as const;

// ===============================================
// CONFIGURACIÓN DE VALIDACIÓN
// ===============================================
export const VALIDATION_RULES = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z0-9_]+$/,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 128,
  },
  PRODUCT_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 255,
  },
  CATEGORY_NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 100,
  },
  PRICE: {
    MIN: 0,
    MAX: 999999.99,
  },
  QUANTITY: {
    MIN: 0,
    MAX: 999999,
  },
} as const;

// ===============================================
// CONFIGURACIÓN DE TIEMPO
// ===============================================
export const TIME_CONFIG = {
  DEBOUNCE_DELAY: 300, // ms
  TOAST_DURATION: 4000, // ms
  AUTO_REFRESH_INTERVAL: 30000, // 30 segundos
  SESSION_CHECK_INTERVAL: 60000, // 1 minuto
} as const;