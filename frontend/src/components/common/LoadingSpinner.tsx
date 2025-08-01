// ===============================================
// PASO 9.3 - frontend/src/components/common/LoadingSpinner.tsx
// COMPONENTE LOADING SPINNER
// ===============================================

import React from 'react';
import clsx from 'clsx';

// ===============================================
// TIPOS Y INTERFACES
// ===============================================
interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'secondary' | 'white' | 'current';
  text?: string;
  centered?: boolean;
  overlay?: boolean;
  className?: string;
}

// ===============================================
// COMPONENTE PRINCIPAL
// ===============================================
const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  text,
  centered = false,
  overlay = false,
  className,
}) => {
  // ===============================================
  // CLASES DE TAMAÑO
  // ===============================================
  const sizeClasses = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  // ===============================================
  // CLASES DE COLOR
  // ===============================================
  const colorClasses = {
    primary: 'text-primary-600',
    secondary: 'text-secondary-600',
    white: 'text-white',
    current: 'text-current',
  };

  // ===============================================
  // CLASES DEL SPINNER
  // ===============================================
  const spinnerClasses = clsx(
    'animate-spin',
    sizeClasses[size],
    colorClasses[color],
    className
  );

  // ===============================================
  // CLASES DEL CONTENEDOR
  // ===============================================
  const containerClasses = clsx(
    'flex',
    'items-center',
    'gap-3',
    {
      'justify-center': centered,
      'fixed inset-0 bg-black bg-opacity-50 z-50': overlay,
    }
  );

  // ===============================================
  // CLASES DEL TEXTO
  // ===============================================
  const textClasses = clsx(
    'text-sm',
    'font-medium',
    {
      'text-secondary-600': color !== 'white',
      'text-white': color === 'white',
    }
  );

  // ===============================================
  // SPINNER SVG
  // ===============================================
  const SpinnerSVG = () => (
    <svg
      className={spinnerClasses}
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
  if (overlay) {
    return (
      <div className={containerClasses}>
        <div className="bg-white rounded-lg p-6 shadow-lg flex flex-col items-center gap-4">
          <SpinnerSVG />
          {text && <p className={textClasses}>{text}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <SpinnerSVG />
      {text && <span className={textClasses}>{text}</span>}
    </div>
  );
};

export default LoadingSpinner;