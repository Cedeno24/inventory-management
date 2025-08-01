// ===============================================
// PASO 9.17 - frontend/src/pages/auth/LoginPage.tsx
// PÁGINA DE LOGIN
// ===============================================

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { validateForm, isEmail, isRequired } from '../../utils/validators';

// ===============================================
// TIPOS
// ===============================================
interface LoginForm {
  email: string;
  password: string;
}

interface LocationState {
  from?: {
    pathname: string;
  };
}

// ===============================================
// COMPONENTE PRINCIPAL
// ===============================================
const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, isLoading } = useAuth();

  // ===============================================
  // ESTADO
  // ===============================================
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ===============================================
  // EFECTOS
  // ===============================================
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      const from = (location.state as LocationState)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, location]);

  // ===============================================
  // MANEJADORES
  // ===============================================
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar formulario
    const { isValid, errors: validationErrors } = validateForm(formData, {
      email: isEmail,
      password: isRequired,
    });

    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const success = await login(formData.email, formData.password);
      
      if (success) {
        toast.success('¡Bienvenido de vuelta!');
        const from = (location.state as LocationState)?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al iniciar sesión');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ===============================================
  // ICONOS
  // ===============================================
  const EmailIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
    </svg>
  );

  const PasswordIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );

  // ===============================================
  // LOADING STATE
  // ===============================================
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text="Verificando autenticación..." />
      </div>
    );
  }

  // ===============================================
  // RENDER
  // ===============================================
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">SI</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Accede a tu sistema de inventario
          </p>
        </div>

        {/* Formulario */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Email */}
            <Input
              id="email"
              name="email"
              type="email"
              label="Correo Electrónico"
              placeholder="tu@email.com"
              value={formData.email}
              onChange={handleInputChange}
              leftIcon={<EmailIcon />}
              error={errors.email}
              required
            />

            {/* Password */}
            <Input
              id="password"
              name="password"
              type="password"
              label="Contraseña"
              placeholder="Tu contraseña"
              value={formData.password}
              onChange={handleInputChange}
              leftIcon={<PasswordIcon />}
              error={errors.password}
              required
            />
          </div>

          {/* Opciones adicionales */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Recordarme
              </label>
            </div>

            <div className="text-sm">
              <a
                href="#"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            fullWidth
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </Button>

          {/* Link to register */}
          <div className="text-center">
            <span className="text-sm text-gray-600">
              ¿No tienes una cuenta?{' '}
              <Link
                to="/register"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Regístrate aquí
              </Link>
            </span>
          </div>
        </form>

        {/* Demo credentials */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 font-medium mb-2">Credenciales de demo:</p>
          <div className="text-xs text-blue-700 space-y-1">
            <p><strong>Admin:</strong> admin@inventory.com / password</p>
            <p><strong>Usuario:</strong> user@inventory.com / password</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;