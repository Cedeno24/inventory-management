// ===============================================
// PASO 9.27 - frontend/src/components/forms/ProductForm.tsx
// FORMULARIO DE PRODUCTOS
// ===============================================

import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Button from '../common/Button';
import Input from '../common/Input';
import LoadingSpinner from '../common/LoadingSpinner';
import { useApi } from '../../hooks/useApi';
import { productService, categoryService } from '../../services/api';
import { Product, Category, CreateProductRequest, UpdateProductRequest } from '../../types';
import { validateForm, validateProductName, validatePrice, validateQuantity } from '../../utils/validators';

// ===============================================
// TIPOS Y INTERFACES
// ===============================================
interface ProductFormProps {
  product?: Product;
  onSubmit: (product: Product) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  quantity: string;
  min_stock: string;
  category_id: string;
}

// ===============================================
// COMPONENTE PRINCIPAL
// ===============================================
const ProductForm: React.FC<ProductFormProps> = ({
  product,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  // ===============================================
  // ESTADO
  // ===============================================
  const [formData, setFormData] = useState<ProductFormData>({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price?.toString() || '',
    quantity: product?.quantity?.toString() || '',
    min_stock: product?.min_stock?.toString() || '',
    category_id: product?.category_id?.toString() || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ===============================================
  // HOOKS API
  // ===============================================
  const {
    data: categoriesData,
    loading: categoriesLoading,
    execute: fetchCategories
  } = useApi(categoryService.getCategories);

  const {
    execute: createProduct
  } = useApi(productService.createProduct, {
    showSuccessToast: true,
    successMessage: 'Producto creado exitosamente',
  });

  const {
    execute: updateProduct
  } = useApi(productService.updateProduct, {
    showSuccessToast: true,
    successMessage: 'Producto actualizado exitosamente',
  });

  // ===============================================
  // EFECTOS
  // ===============================================
  useEffect(() => {
    const loadCategories = async () => {
      const result = await fetchCategories();
      if (result) {
        setCategories(result);
      }
    };

    loadCategories();
  }, []);

  // ===============================================
  // VALIDADORES
  // ===============================================
  const validateMinStock = (minStock: string) => {
    const quantity = parseInt(formData.quantity);
    const minStockValue = parseInt(minStock);

    if (!minStock) {
      return { isValid: false, error: 'El stock mínimo es requerido' };
    }

    if (isNaN(minStockValue) || minStockValue < 0) {
      return { isValid: false, error: 'Debe ser un número positivo' };
    }

    if (!isNaN(quantity) && minStockValue > quantity) {
      return { isValid: false, error: 'No puede ser mayor que la cantidad actual' };
    }

    return { isValid: true };
  };

  const validateCategoryId = (categoryId: string) => {
    if (!categoryId) {
      return { isValid: false, error: 'Selecciona una categoría' };
    }
    return { isValid: true };
  };

  // ===============================================
  // MANEJADORES
  // ===============================================
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
      name: validateProductName,
      price: validatePrice,
      quantity: validateQuantity,
      min_stock: validateMinStock,
      category_id: validateCategoryId,
    });

    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        min_stock: parseInt(formData.min_stock),
        category_id: parseInt(formData.category_id),
      };

      let result;
      if (product) {
        // Actualizar producto existente
        result = await updateProduct(product.id, productData as UpdateProductRequest);
      } else {
        // Crear nuevo producto
        result = await createProduct(productData as CreateProductRequest);
      }

      if (result) {
        onSubmit(result);
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar el producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ===============================================
  // RENDER LOADING CATEGORIES
  // ===============================================
  if (categoriesLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="lg" text="Cargando formulario..." />
      </div>
    );
  }

  // ===============================================
  // RENDER PRINCIPAL
  // ===============================================
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información básica */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          Información del Producto
        </h3>
        
        <div className="grid grid-cols-1 gap-4">
          {/* Nombre */}
          <Input
            label="Nombre del Producto"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            error={errors.name}
            placeholder="Ej: Laptop Dell Inspiron"
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
              placeholder="Descripción detallada del producto..."
            />
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoría *
            </label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={handleInputChange}
              className="block w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="">Selecciona una categoría</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.category_id && (
              <p className="mt-2 text-sm text-red-600">{errors.category_id}</p>
            )}
          </div>
        </div>
      </div>

      {/* Información financiera e inventario */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">
          Precio e Inventario
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Precio */}
          <Input
            label="Precio"
            name="price"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={handleInputChange}
            error={errors.price}
            placeholder="0.00"
            leftIcon={
              <span className="text-gray-500">$</span>
            }
            required
          />

          {/* Cantidad */}
          <Input
            label="Cantidad en Stock"
            name="quantity"
            type="number"
            min="0"
            value={formData.quantity}
            onChange={handleInputChange}
            error={errors.quantity}
            placeholder="0"
            required
          />

          {/* Stock mínimo */}
          <Input
            label="Stock Mínimo"
            name="min_stock"
            type="number"
            min="0"
            value={formData.min_stock}
            onChange={handleInputChange}
            error={errors.min_stock}
            placeholder="0"
            helperText="Alerta cuando el stock baje de este número"
            required
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
          {product ? 'Actualizar Producto' : 'Crear Producto'}
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;