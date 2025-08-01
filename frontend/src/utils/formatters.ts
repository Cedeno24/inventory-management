// ===============================================
// PASO 9.14 - frontend/src/utils/formatters.ts
// UTILIDADES DE FORMATEO
// ===============================================

// ===============================================
// FORMATEO DE MONEDA
// ===============================================
export const formatCurrency = (
  amount: number,
  currency: string = 'USD',
  locale: string = 'es-ES'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// ===============================================
// FORMATEO DE NÚMEROS
// ===============================================
export const formatNumber = (
  value: number,
  locale: string = 'es-ES',
  options?: Intl.NumberFormatOptions
): string => {
  return new Intl.NumberFormat(locale, options).format(value);
};

// ===============================================
// FORMATEO DE FECHAS
// ===============================================
export const formatDate = (
  date: string | Date,
  locale: string = 'es-ES',
  options?: Intl.DateTimeFormatOptions
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };

  return new Intl.DateTimeFormat(locale, { ...defaultOptions, ...options }).format(dateObj);
};

export const formatDateTime = (
  date: string | Date,
  locale: string = 'es-ES'
): string => {
  return formatDate(date, locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTime = (
  date: string | Date,
  locale: string = 'es-ES'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat(locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
};

// ===============================================
// FORMATEO DE TEXTO
// ===============================================
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const capitalizeFirst = (text: string): string => {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export const capitalizeWords = (text: string): string => {
  if (!text) return text;
  return text
    .split(' ')
    .map(word => capitalizeFirst(word))
    .join(' ');
};

export const kebabCase = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const camelCase = (text: string): string => {
  return text
    .replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
    .replace(/^(.)/, (_, c) => c.toLowerCase());
};

// ===============================================
// FORMATEO DE TAMAÑO DE ARCHIVO
// ===============================================
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// ===============================================
// FORMATEO DE PORCENTAJES
// ===============================================
export const formatPercentage = (
  value: number,
  decimals: number = 1,
  locale: string = 'es-ES'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
};

// ===============================================
// FORMATEO DE TIEMPO RELATIVO
// ===============================================
export const formatRelativeTime = (
  date: string | Date,
  locale: string = 'es'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'hace unos segundos';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
  }

  if (diffInDays < 30) {
    const weeks = Math.floor(diffInDays / 7);
    return `hace ${weeks} semana${weeks > 1 ? 's' : ''}`;
  }

  if (diffInDays < 365) {
    const months = Math.floor(diffInDays / 30);
    return `hace ${months} mes${months > 1 ? 'es' : ''}`;
  }

  const years = Math.floor(diffInDays / 365);
  return `hace ${years} año${years > 1 ? 's' : ''}`;
};

// ===============================================
// FORMATEO DE CÓDIGOS
// ===============================================
export const formatProductCode = (id: number): string => {
  return `PROD-${id.toString().padStart(6, '0')}`;
};

export const formatCategoryCode = (id: number): string => {
  return `CAT-${id.toString().padStart(4, '0')}`;
};

// ===============================================
// FORMATEO DE STOCK
// ===============================================
export const formatStockLevel = (quantity: number, minStock: number): {
  level: 'low' | 'medium' | 'high';
  percentage: number;
  label: string;
} => {
  const percentage = minStock > 0 ? (quantity / minStock) * 100 : 100;
  
  let level: 'low' | 'medium' | 'high';
  let label: string;

  if (percentage <= 50) {
    level = 'low';
    label = 'Stock Bajo';
  } else if (percentage <= 100) {
    level = 'medium';
    label = 'Stock Medio';
  } else {
    level = 'high';
    label = 'Stock Alto';
  }

  return {
    level,
    percentage: Math.min(percentage, 100),
    label,
  };
};