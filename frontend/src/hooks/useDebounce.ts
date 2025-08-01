// ===============================================
// PASO 9.12 - frontend/src/hooks/useDebounce.ts
// CUSTOM HOOK PARA DEBOUNCE
// ===============================================

import { useState, useEffect } from 'react';

// ===============================================
// HOOK PRINCIPAL
// ===============================================
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};