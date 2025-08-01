// ===============================================
// CONTEXTO DE AUTENTICACIÓN
// ===============================================

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Cookies from 'js-cookie';
import { authService } from '../services/api';
import { User, AuthState, ChildrenProps } from '../types';

// ===============================================
// TIPOS DEL CONTEXTO
// ===============================================
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => void;
}

// ===============================================
// ACCIONES DEL REDUCER
// ===============================================
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; accessToken: string; refreshToken: string } }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'UPDATE_PROFILE'; payload: Partial<User> }
  | { type: 'SET_LOADING'; payload: boolean };

// ===============================================
// ESTADO INICIAL
// ===============================================
const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,
};

// ===============================================
// REDUCER
// ===============================================
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
      };

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken,
        isLoading: false,
        isAuthenticated: true,
      };

    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        isAuthenticated: false,
      };

    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };

    case 'UPDATE_PROFILE':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    default:
      return state;
  }
};

// ===============================================
// CREAR CONTEXTO
// ===============================================
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ===============================================
// PROVIDER
// ===============================================
export const AuthProvider: React.FC<ChildrenProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // ===============================================
  // VERIFICAR TOKEN AL CARGAR
  // ===============================================
  useEffect(() => {
    const initializeAuth = async () => {
      const token = Cookies.get('inventory_token');
      const refreshToken = Cookies.get('inventory_refresh_token');

      console.log('🔍 Inicializando auth, token encontrado:', !!token);

      if (token && refreshToken) {
        try {
          const user = await authService.getProfile();
          console.log('✅ Usuario obtenido:', user);
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user,
              accessToken: token,
              refreshToken,
            },
          });
        } catch (error) {
          console.log('❌ Error al obtener perfil:', error);
          // Token inválido, limpiar
          Cookies.remove('inventory_token');
          Cookies.remove('inventory_refresh_token');
          dispatch({ type: 'LOGIN_FAILURE' });
        }
      } else {
        console.log('❌ No hay token guardado');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeAuth();
  }, []);

  // ===============================================
  // FUNCIONES DE AUTENTICACIÓN
  // ===============================================
  const login = async (email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });

    try {
      console.log('🔄 Intentando login para:', email);
      const response = await authService.login({ email, password });
      console.log('✅ Login exitoso:', response);
      
      // Guardar tokens en cookies
      Cookies.set('inventory_token', response.accessToken, { expires: 7 });
      Cookies.set('inventory_refresh_token', response.refreshToken, { expires: 30 });
      
      console.log('💾 Tokens guardados en cookies');

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.user,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        },
      });

      return true;
    } catch (error) {
      console.log('❌ Error en login:', error);
      dispatch({ type: 'LOGIN_FAILURE' });
      return false;
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const response = await authService.register({ username, email, password });
      
      // Guardar tokens en cookies
      Cookies.set('inventory_token', response.accessToken, { expires: 7 });
      Cookies.set('inventory_refresh_token', response.refreshToken, { expires: 30 });

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.user,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        },
      });

      return true;
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      return false;
    }
  };

  const logout = () => {
    console.log('🚪 Cerrando sesión');
    Cookies.remove('inventory_token');
    Cookies.remove('inventory_refresh_token');
    dispatch({ type: 'LOGOUT' });
    toast.success('Sesión cerrada exitosamente');
  };

  const updateProfile = (userData: Partial<User>) => {
    dispatch({ type: 'UPDATE_PROFILE', payload: userData });
  };

  // ===============================================
  // VALOR DEL CONTEXTO
  // ===============================================
  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ===============================================
// HOOK PERSONALIZADO
// ===============================================
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};