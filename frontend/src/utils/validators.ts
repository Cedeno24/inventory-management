// ===============================================
// PASO 9.15 - frontend/src/utils/validators.ts
// UTILIDADES DE VALIDACIÓN
// ===============================================

import { VALIDATION_RULES } from './constants';

// ===============================================
// TIPOS
// ===============================================
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// ===============================================
// VALIDADORES BÁSICOS
// ===============================================
export const isRequired = (value: any): ValidationResult => {
  const isValid = value !== null && value !== undefined && value !== '';
  return {
    isValid,
    error: isValid ? undefined : 'Este campo es requerido',
  };
};

export const isEmail = (email: string): ValidationResult => {
  if (!email) {
    return { isValid: false, error: 'El email es requerido' };
  }

  const isValid = VALIDATION_RULES.EMAIL.PATTERN.test(email);
  return {
    isValid,
    error: isValid ? undefined : 'El formato del email no es válido',
  };
};

export const isMinLength = (value: string, minLength: number): ValidationResult => {
  if (!value) {
    return { isValid: false, error: 'Este campo es requerido' };
  }

  const isValid = value.length >= minLength;
  return {
    isValid,
    error: isValid ? undefined : `Debe tener al menos ${minLength} caracteres`,
  };
};

export const isMaxLength = (value: string, maxLength: number): ValidationResult => {
  if (!value) return { isValid: true };

  const isValid = value.length <= maxLength;
  return {
    isValid,
    error: isValid ? undefined : `No puede tener más de ${maxLength} caracteres`,
  };
};

export const isNumber = (value: any): ValidationResult => {
  const isValid = !isNaN(value) && !isNaN(parseFloat(value));
  return {
    isValid,
    error: isValid ? undefined : 'Debe ser un número válido',
  };
};

export const isPositiveNumber = (value: any): ValidationResult => {
  const numberCheck = isNumber(value);
  if (!numberCheck.isValid) return numberCheck;

  const isValid = parseFloat(value) >= 0;
  return {
    isValid,
    error: isValid ? undefined : 'Debe ser un número positivo',
  };
};

export const isInteger = (value: any): ValidationResult => {
  const numberCheck = isNumber(value);
  if (!numberCheck.isValid) return numberCheck;

  const isValid = Number.isInteger(parseFloat(value));
  return {
    isValid,
    error: isValid ? undefined : 'Debe ser un número entero',
  };
};

// ===============================================
// VALIDADORES ESPECÍFICOS
// ===============================================
export const validateUsername = (username: string): ValidationResult => {
  // Requerido
  const requiredCheck = isRequired(username);
  if (!requiredCheck.isValid) return requiredCheck;

  // Longitud mínima
  const minLengthCheck = isMinLength(username, VALIDATION_RULES.USERNAME.MIN_LENGTH);
  if (!minLengthCheck.isValid) return minLengthCheck;

  // Longitud máxima
  const maxLengthCheck = isMaxLength(username, VALIDATION_RULES.USERNAME.MAX_LENGTH);
  if (!maxLengthCheck.isValid) return maxLengthCheck;

  // Patrón
  const isValid = VALIDATION_RULES.USERNAME.PATTERN.test(username);
  return {
    isValid,
    error: isValid ? undefined : 'Solo se permiten letras, números y guiones bajos',
  };
};

export const validatePassword = (password: string): ValidationResult => {
  // Requerido
  const requiredCheck = isRequired(password);
  if (!requiredCheck.isValid) return requiredCheck;

  // Longitud mínima
  const minLengthCheck = isMinLength(password, VALIDATION_RULES.PASSWORD.MIN_LENGTH);
  if (!minLengthCheck.isValid) return minLengthCheck;

  // Longitud máxima
  const maxLengthCheck = isMaxLength(password, VALIDATION_RULES.PASSWORD.MAX_LENGTH);
  if (!maxLengthCheck.isValid) return maxLengthCheck;

  return { isValid: true };
};

export const validateProductName = (name: string): ValidationResult => {
  // Requerido
  const requiredCheck = isRequired(name);
  if (!requiredCheck.isValid) return requiredCheck;

  // Longitud mínima
  const minLengthCheck = isMinLength(name, VALIDATION_RULES.PRODUCT_NAME.MIN_LENGTH);
  if (!minLengthCheck.isValid) return minLengthCheck;

  // Longitud máxima
  const maxLengthCheck = isMaxLength(name, VALIDATION_RULES.PRODUCT_NAME.MAX_LENGTH);
  if (!maxLengthCheck.isValid) return maxLengthCheck;

  return { isValid: true };
};

export const validateCategoryName = (name: string): ValidationResult => {
  // Requerido
  const requiredCheck = isRequired(name);
  if (!requiredCheck.isValid) return requiredCheck;

  // Longitud mínima
  const minLengthCheck = isMinLength(name, VALIDATION_RULES.CATEGORY_NAME.MIN_LENGTH);
  if (!minLengthCheck.isValid) return minLengthCheck;

  // Longitud máxima
  const maxLengthCheck = isMaxLength(name, VALIDATION_RULES.CATEGORY_NAME.MAX_LENGTH);
  if (!maxLengthCheck.isValid) return maxLengthCheck;

  return { isValid: true };
};

export const validatePrice = (price: any): ValidationResult => {
  // Requerido
  const requiredCheck = isRequired(price);
  if (!requiredCheck.isValid) return requiredCheck;

  // Es número
  const numberCheck = isNumber(price);
  if (!numberCheck.isValid) return numberCheck;

  // Es positivo
  const positiveCheck = isPositiveNumber(price);
  if (!positiveCheck.isValid) return positiveCheck;

  // Rango
  const numPrice = parseFloat(price);
  const isValid = numPrice >= VALIDATION_RULES.PRICE.MIN && numPrice <= VALIDATION_RULES.PRICE.MAX;
  return {
    isValid,
    error: isValid ? undefined : `El precio debe estar entre ${VALIDATION_RULES.PRICE.MIN} y ${VALIDATION_RULES.PRICE.MAX}`,
  };
};

export const validateQuantity = (quantity: any): ValidationResult => {
  // Requerido
  const requiredCheck = isRequired(quantity);
  if (!requiredCheck.isValid) return requiredCheck;

  // Es número
  const numberCheck = isNumber(quantity);
  if (!numberCheck.isValid) return numberCheck;

  // Es entero
  const integerCheck = isInteger(quantity);
  if (!integerCheck.isValid) return integerCheck;

  // Es positivo
  const positiveCheck = isPositiveNumber(quantity);
  if (!positiveCheck.isValid) return positiveCheck;

  // Rango
  const numQuantity = parseInt(quantity);
  const isValid = numQuantity >= VALIDATION_RULES.QUANTITY.MIN && numQuantity <= VALIDATION_RULES.QUANTITY.MAX;
  return {
    isValid,
    error: isValid ? undefined : `La cantidad debe estar entre ${VALIDATION_RULES.QUANTITY.MIN} y ${VALIDATION_RULES.QUANTITY.MAX}`,
  };
};

// ===============================================
// VALIDADOR DE FORMULARIOS
// ===============================================
export const validateForm = (
  data: Record<string, any>,
  rules: Record<string, (value: any) => ValidationResult>
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  let isValid = true;

  for (const [field, validator] of Object.entries(rules)) {
    const result = validator(data[field]);
    if (!result.isValid) {
      errors[field] = result.error || 'Error de validación';
      isValid = false;
    }
  }

  return { isValid, errors };
};

// ===============================================
// VALIDADORES DE ARCHIVOS
// ===============================================
export const validateFile = (file: File): ValidationResult => {
  // Tamaño
  if (file.size > 5 * 1024 * 1024) { // 5MB
    return {
      isValid: false,
      error: 'El archivo no puede ser mayor a 5MB',
    };
  }

  // Tipo
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Solo se permiten archivos de imagen (JPG, PNG, GIF, WebP)',
    };
  }

  return { isValid: true };
};