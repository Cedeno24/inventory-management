// ===============================================
// PASO 9.16 - frontend/src/utils/storage.ts
// UTILIDADES DE ALMACENAMIENTO
// ===============================================

// ===============================================
// INTERFAZ PARA STORAGE
// ===============================================
interface StorageInterface {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear(): void;
}

// ===============================================
// IMPLEMENTACIÓN SEGURA DE STORAGE
// ===============================================
class SafeStorage implements StorageInterface {
  private storage: Storage;

  constructor(storage: Storage) {
    this.storage = storage;
  }

  getItem(key: string): string | null {
    try {
      return this.storage.getItem(key);
    } catch (error) {
      console.warn(`Error al leer del storage: ${error}`);
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      this.storage.setItem(key, value);
    } catch (error) {
      console.warn(`Error al escribir en el storage: ${error}`);
    }
  }

  removeItem(key: string): void {
    try {
      this.storage.removeItem(key);
    } catch (error) {
      console.warn(`Error al eliminar del storage: ${error}`);
    }
  }

  clear(): void {
    try {
      this.storage.clear();
    } catch (error) {
      console.warn(`Error al limpiar el storage: ${error}`);
    }
  }
}

// ===============================================
// INSTANCIAS DE STORAGE
// ===============================================
export const localStorage = new SafeStorage(window.localStorage);
export const sessionStorage = new SafeStorage(window.sessionStorage);

// ===============================================
// UTILIDADES DE ALTO NIVEL
// ===============================================
export const storage = {
  // Métodos para objetos JSON
  setObject<T>(key: string, value: T, useSession: boolean = false): void {
    const storageInstance = useSession ? sessionStorage : localStorage;
    try {
      const serialized = JSON.stringify(value);
      storageInstance.setItem(key, serialized);
    } catch (error) {
      console.warn(`Error al serializar objeto para storage: ${error}`);
    }
  },

  getObject<T>(key: string, defaultValue: T | null = null, useSession: boolean = false): T | null {
    const storageInstance = useSession ? sessionStorage : localStorage;
    try {
      const item = storageInstance.getItem(key);
      if (item === null) return defaultValue;
      return JSON.parse(item) as T;
    } catch (error) {
      console.warn(`Error al deserializar objeto del storage: ${error}`);
      return defaultValue;
    }
  },

  // Métodos para strings
  setString(key: string, value: string, useSession: boolean = false): void {
    const storageInstance = useSession ? sessionStorage : localStorage;
    storageInstance.setItem(key, value);
  },

  getString(key: string, defaultValue: string | null = null, useSession: boolean = false): string | null {
    const storageInstance = useSession ? sessionStorage : localStorage;
    const value = storageInstance.getItem(key);
    return value !== null ? value : defaultValue;
  },

  // Métodos para números
  setNumber(key: string, value: number, useSession: boolean = false): void {
    const storageInstance = useSession ? sessionStorage : localStorage;
    storageInstance.setItem(key, value.toString());
  },

  getNumber(key: string, defaultValue: number | null = null, useSession: boolean = false): number | null {
    const storageInstance = useSession ? sessionStorage : localStorage;
    const value = storageInstance.getItem(key);
    if (value === null) return defaultValue;
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  },

  // Métodos para booleanos
  setBoolean(key: string, value: boolean, useSession: boolean = false): void {
    const storageInstance = useSession ? sessionStorage : localStorage;
    storageInstance.setItem(key, value.toString());
  },

  getBoolean(key: string, defaultValue: boolean | null = null, useSession: boolean = false): boolean | null {
    const storageInstance = useSession ? sessionStorage : localStorage;
    const value = storageInstance.getItem(key);
    if (value === null) return defaultValue;
    return value === 'true';
  },

  // Método para verificar si existe una clave
  hasItem(key: string, useSession: boolean = false): boolean {
    const storageInstance = useSession ? sessionStorage : localStorage;
    return storageInstance.getItem(key) !== null;
  },

  // Método para eliminar un item
  removeItem(key: string, useSession: boolean = false): void {
    const storageInstance = useSession ? sessionStorage : localStorage;
    storageInstance.removeItem(key);
  },

  // Método para limpiar todo el storage
  clear(useSession: boolean = false): void {
    const storageInstance = useSession ? sessionStorage : localStorage;
    storageInstance.clear();
  },

  // Método para obtener todas las claves
  getAllKeys(useSession: boolean = false): string[] {
    const storageInstance = useSession ? sessionStorage : localStorage;
    const keys: string[] = [];
    try {
      const storage = useSession ? window.sessionStorage : window.localStorage;
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key) keys.push(key);
      }
    } catch (error) {
      console.warn(`Error al obtener claves del storage: ${error}`);
    }
    return keys;
  },

  // Método para obtener el tamaño del storage
  getSize(useSession: boolean = false): number {
    try {
      const storage = useSession ? window.sessionStorage : window.localStorage;
      return storage.length;
    } catch (error) {
      console.warn(`Error al obtener tamaño del storage: ${error}`);
      return 0;
    }
  },
};

// ===============================================
// UTILIDADES ESPECÍFICAS PARA LA APP
// ===============================================
export const authStorage = {
  setTokens(accessToken: string, refreshToken: string): void {
    storage.setString('inventory_token', accessToken);
    storage.setString('inventory_refresh_token', refreshToken);
  },

  getTokens(): { accessToken: string | null; refreshToken: string | null } {
    return {
      accessToken: storage.getString('inventory_token'),
      refreshToken: storage.getString('inventory_refresh_token'),
    };
  },

  clearTokens(): void {
    storage.removeItem('inventory_token');
    storage.removeItem('inventory_refresh_token');
  },

  hasValidTokens(): boolean {
    const { accessToken, refreshToken } = this.getTokens();
    return !!(accessToken && refreshToken);
  },
};

export const userPreferences = {
  setTheme(theme: 'light' | 'dark'): void {
    storage.setString('theme', theme);
  },

  getTheme(): 'light' | 'dark' {
    return storage.getString('theme', 'light') as 'light' | 'dark';
  },

  setLanguage(language: string): void {
    storage.setString('language', language);
  },

  getLanguage(): string {
    return storage.getString('language', 'es') || 'es';
  },

  setPageSize(pageSize: number): void {
    storage.setNumber('pageSize', pageSize);
  },

  getPageSize(): number {
    return storage.getNumber('pageSize', 20) || 20;
  },

  setSidebarCollapsed(collapsed: boolean): void {
    storage.setBoolean('sidebarCollapsed', collapsed);
  },

  getSidebarCollapsed(): boolean {
    return storage.getBoolean('sidebarCollapsed', false) || false;
  },
};