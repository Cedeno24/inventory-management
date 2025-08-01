// ===============================================
// PASO 9.33 - frontend/src/components/forms/UserForm.tsx
// FORMULARIO DE USUARIOS
// ===============================================

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import Button from '../common/Button';
import Input from '../common/Input';
import { useApi } from '../../hooks/useApi';
import { userService } from '../../services/api';
import { User, CreateUserRequest, UpdateUserRequest } from '../../types';
import { validateForm, validateUsername, isEmail, validatePassword } from '../../utils/validators';

// ===============================================
// TIPOS Y INTERFACES
// ===============================================
interface UserFormProps {
  user?: User;
  onSubmit: (user: User) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

interface UserFormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'admin' | 'user';
}

// ===============================================
// COMPONENTE PRINCIPAL
// ===============================================
const UserForm: React.FC<UserFormProps> = ({
  user,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  // ===============================================
  // ESTADO
  // ===============================================
  const [formData, setFormData] = useState<UserFormData>({
    username: user?.username || '',
    email: user?.email || '',
    password: '',
    confirmPassword: '',
    role: (user?.role as 'admin' | 'user') || 'user',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ===============================================
  // HOOKS API
  // ===============================================
  const {
    execute: createUser
  } = useApi(userService.createUser, {
    showSuccessToast: true,
    successMessage: 'Usuario creado exitosamente',
  });

  const {
    execute: updateUser
  } = useApi(userService.updateUser, {
    showSuccessToast: true,
    successMessage: 'Usuario actualizado exitosamente',
  });

  // ===============================================
  // VALIDADORES PERSONALIZADOS
  // ===============================================
  const validateConfirmPassword = (confirmPassword: string) => {
    if (user) {
      // En modo edición, la contraseña es opcional
      if (!formData.password && !confirmPassword) {
        return { isValid: true };
      }
    } else {
      // En modo creación, la contraseña es requerida
      if (!confirmPassword) {
        return { isValid: false, error: 'Confirma tu contraseña' };
      }
    }
    
    if (confirmPassword !== formData.password) {
      return { isValid: false, error: 'Las contraseñas no coinciden' };
    }
    return { isValid: true };
  };

  const validatePasswordOptional = (password: string) => {
    if (user) {
      // En modo edición, la contraseña es opcional
      if (!password) {
        return { isValid: true };
      }
    }
    // Si se proporciona contraseña, validarla
    return validatePassword(password);
  };

  // ===============================================
  // MANEJADORES
  // ===============================================
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
    const validationRules: Record<string, (value: any) => any> = {
      username: validateUsername,
      email: isEmail,
      role: (value: string) => value ? { isValid: true } : { isValid: false, error: 'Selecciona un rol' },
    };

    // Solo validar contraseña si estamos creando un usuario o si se proporcionó una contraseña
    if (!user || formData.password) {
      validationRules.password = user ? validatePasswordOptional : validatePassword;
      validationRules.confirmPassword = validateConfirmPassword;
    }

    const { isValid, errors: validationErrors } = validateForm(formData, validationRules);

    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const userData: any = {
        username: formData.username.trim(),
        email: formData.email.trim(),
        role: formData.role,
      };

      // Solo incluir contraseña si se proporcionó
      if (formData.password) {
        userData.password = formData.password;
      }

      let result;
      if (user) {
        // Actualizar usuario existente
        result = await updateUser(user.id, userData as UpdateUserRequest);
      } else {
        // Crear nuevo usuario
        result = await createUser(userData as CreateUserRequest);
      }

      if (result) {
        onSubmit(result);
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar el usuario');
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

  const ShieldIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );

  // ===============================================
  // RENDER
  // ===============================================
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información básica */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          Información del Usuario
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Username */}
          <Input
            label="Nombre de Usuario"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            error={errors.username}
            placeholder="usuario123"
            leftIcon={<UserIcon />}
            helperText="Solo letras, números y guiones bajos"
            required
          />

          {/* Email */}
          <Input
            label="Correo Electrónico"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            error={errors.email}
            placeholder="usuario@email.com"
            leftIcon={<EmailIcon />}
            required
          />
        </div>

        {/* Rol */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <ShieldIcon />
              Rol *
            </div>
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            className="block w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            required
          >
            <option value="user">Usuario</option>
            <option value="admin">Administrador</option>
          </select>
          {errors.role && (
            <p className="mt-2 text-sm text-red-600">{errors.role}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {formData.role === 'admin' 
              ? 'Acceso completo a todas las funciones del sistema'
              : 'Acceso limitado a gestión de productos e inventario'
            }
          </p>
        </div>
      </div>

      {/* Contraseña */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          {user ? 'Cambiar Contraseña (Opcional)' : 'Contraseña'}
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Password */}
          <Input
            label={user ? "Nueva Contraseña" : "Contraseña"}
            name="password"
            type="password"
            value={formData.password}
            onChange={handleInputChange}
            error={errors.password}
            placeholder={user ? "Dejar vacío para mantener actual" : "Tu contraseña"}
            leftIcon={<PasswordIcon />}
            helperText="Mínimo 6 caracteres"
            required={!user}
          />

          {/* Confirm Password */}
          <Input
            label="Confirmar Contraseña"
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            error={errors.confirmPassword}
            placeholder="Confirma la contraseña"
            leftIcon={<PasswordIcon />}
            required={!user || !!formData.password}
          />
        </div>
      </div>

      {/* Botones */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting || isLoading}
          className="sm:w-auto"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          isLoading={isSubmitting || isLoading}
          disabled={isSubmitting || isLoading}
          className="sm:w-auto"
        >
          {user ? 'Actualizar Usuario' : 'Crear Usuario'}
        </Button>
      </div>
    </form>
  );
};

export default UserForm;