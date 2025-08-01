// ===============================================
// PASO 9.30 - frontend/src/components/forms/CategoryForm.tsx
// FORMULARIO DE CATEGORÍAS
// ===============================================

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import Button from '../common/Button';
import Input from '../common/Input';
import { useApi } from '../../hooks/useApi';
import { categoryService } from '../../services/api';
import { Category, CreateCategoryRequest, UpdateCategoryRequest } from '../../types';
import { validateForm, validateCategoryName } from '../../utils/validators';

// ===============================================
// TIPOS Y INTERFACES
// ===============================================
interface CategoryFormProps {
  category?: Category;
  onSubmit: (category: Category) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

interface CategoryFormData {
  name: string;
  description: string;
}

// ===============================================
// COMPONENTE PRINCIPAL
// ===============================================
const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  // ===============================================
  // ESTADO
  // ===============================================
  const [formData, setFormData] = useState<CategoryFormData>({
    name: category?.name || '',
    description: category?.description || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ===============================================
  // HOOKS API
  // ===============================================
  const {
    execute: createCategory
  } = useApi(categoryService.createCategory, {
    showSuccessToast: true,
    successMessage: 'Categoría creada exitosamente',
  });

  const {
    execute: updateCategory
  } = useApi(categoryService.updateCategory, {
    showSuccessToast: true,
    successMessage: 'Categoría actualizada exitosamente',
  });

  // ===============================================
  // MANEJADORES
  // ===============================================
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
      name: validateCategoryName,
    });

    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const categoryData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
      };

      let result;
      if (category) {
        // Actualizar categoría existente
        result = await updateCategory(category.id, categoryData as UpdateCategoryRequest);
      } else {
        // Crear nueva categoría
        result = await createCategory(categoryData as CreateCategoryRequest);
      }

      if (result) {
        onSubmit(result);
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar la categoría');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ===============================================
  // RENDER
  // ===============================================
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información básica */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          Información de la Categoría
        </h3>
        
        <div className="space-y-4">
          {/* Nombre */}
          <Input
            label="Nombre de la Categoría"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            error={errors.name}
            placeholder="Ej: Electrónicos, Ropa, Libros..."
            required
          />

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="block w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Descripción de la categoría (opcional)..."
            />
          </div>
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
          {category ? 'Actualizar Categoría' : 'Crear Categoría'}
        </Button>
      </div>
    </form>
  );
};

export default CategoryForm;