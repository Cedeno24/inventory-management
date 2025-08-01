// ===============================================
// PASO 9.18 - frontend/src/pages/auth/RegisterPage.tsx
// PÁGINA DE REGISTRO
// ===============================================

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { validateForm, validateUsername, isEmail, validatePassword } from '../../utils/validators';

// ===============================================
// TIPOS
// ===============================================
interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// ===============================================
// COMPONENTE PRINCIPAL
// ===============================================
const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isAuthenticated, isLoading } = useAuth();

  // ===============================================
  // ESTADO
  // ===============================================
  const [formData, setFormData] = useState<RegisterForm>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ===============================================
  // EFECTOS
  // ===============================================
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // ===============================================
  // VALIDADOR DE CONFIRMACIÓN DE CONTRASEÑA
  // ===============================================
  const validateConfirmPassword = (confirmPassword: string) => {
    if (!confirmPassword) {
      return { isValid: false, error: 'Confirma tu contraseña' };
    }
    if (confirmPassword !== formData.password) {
      return { isValid: false, error: 'Las contraseñas no coinciden' };
    }
    return { isValid: true };
  };

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
      username: validateUsername,
      email: isEmail,
      password: validatePassword,
      confirmPassword: validateConfirmPassword,
    });

    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const success = await register(formData.username, formData.email, formData.password);
      
      if (success) {
        toast.success('¡Cuenta creada exitosamente!');
        navigate('/dashboard', { replace: true });
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al crear la cuenta');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ===============================================
  // ICONOS
  // ===============================================
  const UserIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

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
            Crear Cuenta
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Únete al sistema de inventario
          </p>
        </div>

        {/* Formulario */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Username */}
            <Input
              id="username"
              name="username"
              type="text"
              label="Nombre de Usuario"
              placeholder="tu_usuario"
              value={formData.username}
              onChange={handleInputChange}
              leftIcon={<UserIcon />}
              error={errors.username}
              helperText="Solo letras, números y guiones bajos"
              required
            />

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
              helperText="Mínimo 6 caracteres"
              required
            />

            {/* Confirm Password */}
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              label="Confirmar Contraseña"
              placeholder="Confirma tu contraseña"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              leftIcon={<PasswordIcon />}
              error={errors.confirmPassword}
              required
            />
          </div>

          {/* Terms and conditions */}
          <div className="flex items-center">
            <input
              id="terms"
              name="terms"
              type="checkbox"
              required
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="terms" className="ml-2 block text-sm text-gray-900">
              Acepto los{' '}
              <a href="#" className="text-primary-600 hover:text-primary-500">
                términos y condiciones
              </a>
            </label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            fullWidth
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creando cuenta...' : 'Crear Cuenta'}
          </Button>

          {/* Link to login */}
          <div className="text-center">
            <span className="text-sm text-gray-600">
              ¿Ya tienes una cuenta?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Inicia sesión aquí
              </Link>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;