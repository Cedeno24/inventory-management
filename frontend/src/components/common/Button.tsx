// ===============================================
// PASO 9.1 - frontend/src/components/common/Button.tsx
// COMPONENTE BUTTON REUTILIZABLE
// ===============================================

import React from 'react';
import clsx from 'clsx';

// ===============================================
// TIPOS Y INTERFACES
// ===============================================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

// ===============================================
// COMPONENTE PRINCIPAL
// ===============================================
const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className,
  children,
  ...props
}) => {
  // ===============================================
  // CLASES BASE
  // ===============================================
  const baseClasses = [
    'inline-flex',
    'items-center',
    'justify-center',
    'font-medium',
    'border',
    'rounded-lg',
    'transition-all',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    'disabled:cursor-not-allowed',
    'disabled:opacity-50',
  ];

  // ===============================================
  // VARIANTES DE COLOR
  // ===============================================
  const variantClasses = {
    primary: [
      'bg-primary-600',
      'text-white',
      'border-primary-600',
      'hover:bg-primary-700',
      'hover:border-primary-700',
      'focus:ring-primary-500',
      'active:bg-primary-800',
    ],
    secondary: [
      'bg-secondary-100',
      'text-secondary-700',
      'border-secondary-200',
      'hover:bg-secondary-200',
      'hover:border-secondary-300',
      'focus:ring-secondary-500',
      'active:bg-secondary-300',
    ],
    success: [
      'bg-success-600',
      'text-white',
      'border-success-600',
      'hover:bg-success-700',
      'hover:border-success-700',
      'focus:ring-success-500',
      'active:bg-success-800',
    ],
    warning: [
      'bg-warning-500',
      'text-white',
      'border-warning-500',
      'hover:bg-warning-600',
      'hover:border-warning-600',
      'focus:ring-warning-400',
      'active:bg-warning-700',
    ],
    danger: [
      'bg-danger-600',
      'text-white',
      'border-danger-600',
      'hover:bg-danger-700',
      'hover:border-danger-700',
      'focus:ring-danger-500',
      'active:bg-danger-800',
    ],
    ghost: [
      'bg-transparent',
      'text-secondary-700',
      'border-transparent',
      'hover:bg-secondary-100',
      'focus:ring-secondary-500',
      'active:bg-secondary-200',
    ],
  };

  // ===============================================
  // TAMAÑOS
  // ===============================================
  const sizeClasses = {
    xs: ['px-2', 'py-1', 'text-xs', 'gap-1'],
    sm: ['px-3', 'py-1.5', 'text-sm', 'gap-1.5'],
    md: ['px-4', 'py-2', 'text-sm', 'gap-2'],
    lg: ['px-6', 'py-2.5', 'text-base', 'gap-2.5'],
    xl: ['px-8', 'py-3', 'text-lg', 'gap-3'],
  };

  // ===============================================
  // CLASES COMBINADAS
  // ===============================================
  const combinedClasses = clsx(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    {
      'w-full': fullWidth,
      'cursor-wait': isLoading,
    },
    className
  );

  // ===============================================
  // COMPONENTE DE LOADING
  // ===============================================
  const LoadingSpinner = () => (
    <svg
      className={clsx('animate-spin', {
        'w-3 h-3': size === 'xs',
        'w-4 h-4': size === 'sm' || size === 'md',
        'w-5 h-5': size === 'lg',
        'w-6 h-6': size === 'xl',
      })}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  // ===============================================
  // RENDER
  // ===============================================
  return (
    <button
      className={combinedClasses}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <LoadingSpinner />
          <span>{children}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;