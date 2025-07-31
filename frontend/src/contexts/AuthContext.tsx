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
// CONTEXTO
// ===============================================
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ===============================================
// PROVIDER
// ===============================================
export const AuthProvider: React.FC<ChildrenProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // ===============================================
  // INICIALIZAR AUTENTICACIÓN
  // ===============================================
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const accessToken = Cookies.get('accessToken');
      const refreshToken = Cookies.get('refreshToken');

      if (accessToken && refreshToken) {
        // Verificar si el token es válido
        const isValid = await authService.verifyToken();
        
        if (isValid) {
          // Obtener perfil del usuario
          const user = await authService.getProfile();
          
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user,
              accessToken,
              refreshToken,
            },
          });
        } else {
          // Token inválido, limpiar
          Cookies.remove('accessToken');
          Cookies.remove('refreshToken');
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('Error inicializando autenticación:', error);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // ===============================================
  // FUNCIONES DE AUTENTICACIÓN
  // ===============================================
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      dispatch({ type: 'LOGIN_START' });

      const response = await authService.login({ email, password });
      
      if (response.success) {
        const { user, tokens } = response.data;
        
        // Guardar tokens en cookies
        Cookies.set('accessToken', tokens.accessToken, { 
          expires: 1, // 1 día
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
        
        Cookies.set('refreshToken', tokens.refreshToken, { 
          expires: 7, // 7 días
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });

        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          },
        });

        toast.success(`¡Bienvenido ${user.username}!`);
        return true;
      } else {
        dispatch({ type: 'LOGIN_FAILURE' });
        toast.error(response.message || 'Error al iniciar sesión');
        return false;
      }
    } catch (error: any) {
      dispatch({ type: 'LOGIN_FAILURE' });
      toast.error(error.message || 'Error al iniciar sesión');
      return false;
    }
  };

  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      dispatch({ type: 'LOGIN_START' });

      const response = await authService.register({ username, email, password });
      
      if (response.success) {
        const { user, tokens } = response.data;
        
        // Guardar tokens en cookies
        Cookies.set('accessToken', tokens.accessToken, { 
          expires: 1,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });
        
        Cookies.set('refreshToken', tokens.refreshToken, { 
          expires: 7,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });

        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: {
            user,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          },
        });

        toast.success(`¡Cuenta creada exitosamente! Bienvenido ${user.username}!`);
        return true;
      } else {
        dispatch({ type: 'LOGIN_FAILURE' });
        toast.error(response.message || 'Error al crear cuenta');
        return false;
      }
    } catch (error: any) {
      dispatch({ type: 'LOGIN_FAILURE' });
      toast.error(error.message || 'Error al crear cuenta');
      return false;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Error en logout:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
      toast.success('Sesión cerrada exitosamente');
    }
  };

  const updateProfile = (userData: Partial<User>) => {
    dispatch({
      type: 'UPDATE_PROFILE',
      payload: userData,
    });
  };

  // ===============================================
  // VALOR DEL CONTEXTO
  // ===============================================
  const contextValue: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// ===============================================
// HOOK PERSONALIZADO
// ===============================================
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  
  return context;
};

export default AuthContext;