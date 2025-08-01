// ===============================================
// RUTAS DE PRODUCTOS
// ===============================================

const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');

const router = express.Router();

// ===============================================
// OBTENER TODOS LOS PRODUCTOS
// ===============================================
router.get('/', async (req, res) => {
  try {
    console.log('📦 Obteniendo productos...');
    
    const { search, category_id, stock_status, page = 1, limit = 20 } = req.query;
    
    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    // Filtros
    if (search) {
      query += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (category_id) {
      query += ` AND p.category_id = $${paramIndex}`;
      params.push(category_id);
      paramIndex++;
    }

    if (stock_status) {
      if (stock_status === 'LOW') {
        query += ` AND p.quantity <= p.min_stock`;
      } else if (stock_status === 'MEDIUM') {
        query += ` AND p.quantity > p.min_stock AND p.quantity <= p.min_stock * 2`;
      } else if (stock_status === 'HIGH') {
        query += ` AND p.quantity > p.min_stock * 2`;
      }
    }

    // Contar total de productos
    const countQuery = query.replace('SELECT p.*, c.name as category_name', 'SELECT COUNT(*) as total');
    const countResult = await pool.query(countQuery, params);
    const totalItems = parseInt(countResult.rows[0].total);

    // Paginación
    const offset = (page - 1) * limit;
    query += ` ORDER BY p.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      success: true,
      data: {
        products: result.rows,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_items: totalItems,
          items_per_page: parseInt(limit),
          has_next: page < totalPages,
          has_previous: page > 1
        }
      }
    });

    console.log(`✅ Productos obtenidos: ${result.rows.length}`);

  } catch (error) {
    console.error('❌ Error al obtener productos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ===============================================
// OBTENER PRODUCTO POR ID
// ===============================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        product: result.rows[0]
      }
    });

  } catch (error) {
    console.error('❌ Error al obtener producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ===============================================
// CREAR PRODUCTO
// ===============================================
router.post('/', [
  body('name').isLength({ min: 2, max: 255 }).withMessage('El nombre debe tener entre 2 y 255 caracteres'),
  body('price').isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo'),
  body('quantity').isInt({ min: 0 }).withMessage('La cantidad debe ser un entero positivo'),
  body('min_stock').isInt({ min: 0 }).withMessage('El stock mínimo debe ser un entero positivo'),
  body('category_id').isInt({ min: 1 }).withMessage('Debe seleccionar una categoría válida'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }

    const { name, description, price, quantity, min_stock, category_id } = req.body;

    // Verificar que la categoría existe
    const categoryExists = await pool.query('SELECT id FROM categories WHERE id = $1', [category_id]);
    if (categoryExists.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La categoría seleccionada no existe'
      });
    }

    const result = await pool.query(`
      INSERT INTO products (name, description, price, quantity, min_stock, category_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `, [name, description || '', price, quantity, min_stock, category_id]);

    // Obtener producto con nombre de categoría
    const productWithCategory = await pool.query(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.id = $1
    `, [result.rows[0].id]);

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: {
        product: productWithCategory.rows[0]
      }
    });

    console.log('✅ Producto creado:', name);

  } catch (error) {
    console.error('❌ Error al crear producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ===============================================
// ACTUALIZAR PRODUCTO
// ===============================================
router.put('/:id', [
  body('name').isLength({ min: 2, max: 255 }).withMessage('El nombre debe tener entre 2 y 255 caracteres'),
  body('price').isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo'),
  body('quantity').isInt({ min: 0 }).withMessage('La cantidad debe ser un entero positivo'),
  body('min_stock').isInt({ min: 0 }).withMessage('El stock mínimo debe ser un entero positivo'),
  body('category_id').isInt({ min: 1 }).withMessage('Debe seleccionar una categoría válida'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { name, description, price, quantity, min_stock, category_id } = req.body;

    // Verificar que el producto existe
    const productExists = await pool.query('SELECT id FROM products WHERE id = $1', [id]);
    if (productExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Verificar que la categoría existe
    const categoryExists = await pool.query('SELECT id FROM categories WHERE id = $1', [category_id]);
    if (categoryExists.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La categoría seleccionada no existe'
      });
    }

    await pool.query(`
      UPDATE products 
      SET name = $1, description = $2, price = $3, quantity = $4, min_stock = $5, category_id = $6, updated_at = NOW()
      WHERE id = $7
    `, [name, description || '', price, quantity, min_stock, category_id, id]);

    // Obtener producto actualizado con nombre de categoría
    const updatedProduct = await pool.query(`
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.id = $1
    `, [id]);

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: {
        product: updatedProduct.rows[0]
      }
    });

    console.log('✅ Producto actualizado:', id);

  } catch (error) {
    console.error('❌ Error al actualizar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ===============================================
// ELIMINAR PRODUCTO
// ===============================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Producto eliminado exitosamente'
    });

    console.log('✅ Producto eliminado:', id);

  } catch (error) {
    console.error('❌ Error al eliminar producto:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;