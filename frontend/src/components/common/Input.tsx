// ===============================================
// PASO 9.2 - frontend/src/components/common/Input.tsx
// COMPONENTE INPUT REUTILIZABLE
// ===============================================

import React, { forwardRef } from 'react';
import clsx from 'clsx';

// ===============================================
// TIPOS Y INTERFACES
// ===============================================
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  variant?: 'default' | 'filled' | 'outlined';
  inputSize?: 'sm' | 'md' | 'lg';
}

// ===============================================
// COMPONENTE PRINCIPAL
// ===============================================
const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  fullWidth = true,
  variant = 'default',
  inputSize = 'md',
  className,
  id,
  ...props
}, ref) => {
  // ===============================================
  // GENERAR ID ÚNICO
  // ===============================================
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  // ===============================================
  // CLASES BASE
  // ===============================================
  const baseInputClasses = [
    'block',
    'w-full',
    'border',
    'rounded-lg',
    'transition-all',
    'duration-200',
    'placeholder-secondary-400',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-primary-500',
    'focus:border-primary-500',
    'disabled:bg-secondary-50',
    'disabled:text-secondary-500',
    'disabled:cursor-not-allowed',
  ];

  // ===============================================
  // VARIANTES
  // ===============================================
  const variantClasses = {
    default: [
      'bg-white',
      'border-secondary-300',
      'text-secondary-900',
      'hover:border-secondary-400',
    ],
    filled: [
      'bg-secondary-50',
      'border-secondary-200',
      'text-secondary-900',
      'hover:bg-secondary-100',
      'hover:border-secondary-300',
    ],
    outlined: [
      'bg-transparent',
      'border-2',
      'border-secondary-300',
      'text-secondary-900',
      'hover:border-secondary-400',
    ],
  };

  // ===============================================
  // TAMAÑOS
  // ===============================================
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-4 py-3 text-base',
  };

  // ===============================================
  // CLASES DE ERROR
  // ===============================================
  const errorClasses = error ? [
    'border-danger-300',
    'text-danger-900',
    'placeholder-danger-300',
    'focus:border-danger-500',
    'focus:ring-danger-500',
  ] : [];

  // ===============================================
  // CLASES COMBINADAS
  // ===============================================
  const inputClasses = clsx(
    baseInputClasses,
    variantClasses[variant],
    sizeClasses[inputSize],
    errorClasses,
    {
      'pl-10': leftIcon && inputSize === 'sm',
      'pl-11': leftIcon && inputSize === 'md',
      'pl-12': leftIcon && inputSize === 'lg',
      'pr-10': rightIcon && inputSize === 'sm',
      'pr-11': rightIcon && inputSize === 'md',
      'pr-12': rightIcon && inputSize === 'lg',
    },
    className
  );

  const containerClasses = clsx({
    'w-full': fullWidth,
  });

  // ===============================================
  // CLASES DE ICONOS
  // ===============================================
  const iconClasses = clsx(
    'absolute',
    'top-1/2',
    'transform',
    '-translate-y-1/2',
    'text-secondary-400',
    {
      'w-4 h-4': inputSize === 'sm',
      'w-5 h-5': inputSize === 'md',
      'w-6 h-6': inputSize === 'lg',
    }
  );

  const leftIconClasses = clsx(iconClasses, {
    'left-3': inputSize === 'sm',
    'left-3.5': inputSize === 'md',
    'left-4': inputSize === 'lg',
  });

  const rightIconClasses = clsx(iconClasses, {
    'right-3': inputSize === 'sm',
    'right-3.5': inputSize === 'md',
    'right-4': inputSize === 'lg',
  });

  // ===============================================
  // RENDER
  // ===============================================
  return (
    <div className={containerClasses}>
      {/* Label */}
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-secondary-700 mb-2"
        >
          {label}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className={leftIconClasses}>
            {leftIcon}
          </div>
        )}

        {/* Input */}
        <input
          ref={ref}
          id={inputId}
          className={inputClasses}
          {...props}
        />

        {/* Right Icon */}
        {rightIcon && (
          <div className={rightIconClasses}>
            {rightIcon}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-2 text-sm text-danger-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <p className="mt-2 text-sm text-secondary-600">
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;