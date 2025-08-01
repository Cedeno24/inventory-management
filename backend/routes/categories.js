// ===============================================
// RUTAS DE CATEGORÍAS
// ===============================================

const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');

const router = express.Router();

// ===============================================
// OBTENER TODAS LAS CATEGORÍAS
// ===============================================
router.get('/', async (req, res) => {
  try {
    console.log('📁 Obteniendo categorías...');
    
    const { include_stats } = req.query;
    
    let query = `
      SELECT c.id, c.name, c.description, c.created_at, c.updated_at
    `;
    
    if (include_stats) {
      query += `, COUNT(p.id) as product_count`;
    }
    
    query += ` FROM categories c`;
    
    if (include_stats) {
      query += ` LEFT JOIN products p ON c.id = p.category_id GROUP BY c.id, c.name, c.description, c.created_at, c.updated_at`;
    }
    
    query += ` ORDER BY c.created_at DESC`;

    const result = await pool.query(query);

    res.json({
      success: true,
      data: {
        categories: result.rows
      }
    });

    console.log(`✅ Categorías obtenidas: ${result.rows.length}`);

  } catch (error) {
    console.error('❌ Error al obtener categorías:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ===============================================
// OBTENER CATEGORÍA POR ID
// ===============================================
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT c.*, COUNT(p.id) as product_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      WHERE c.id = $1
      GROUP BY c.id, c.name, c.description, c.created_at, c.updated_at
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    res.json({
      success: true,
      data: {
        category: result.rows[0]
      }
    });

  } catch (error) {
    console.error('❌ Error al obtener categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ===============================================
// CREAR CATEGORÍA
// ===============================================
router.post('/', [
  body('name').isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
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

    const { name, description } = req.body;

    // Verificar que no existe una categoría con el mismo nombre
    const existingCategory = await pool.query('SELECT id FROM categories WHERE name = $1', [name]);
    if (existingCategory.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una categoría con ese nombre'
      });
    }

    const result = await pool.query(`
      INSERT INTO categories (name, description, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
      RETURNING *
    `, [name, description || '']);

    res.status(201).json({
      success: true,
      message: 'Categoría creada exitosamente',
      data: {
        category: result.rows[0]
      }
    });

    console.log('✅ Categoría creada:', name);

  } catch (error) {
    console.error('❌ Error al crear categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ===============================================
// ACTUALIZAR CATEGORÍA
// ===============================================
router.put('/:id', [
  body('name').isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
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
    const { name, description } = req.body;

    // Verificar que la categoría existe
    const categoryExists = await pool.query('SELECT id FROM categories WHERE id = $1', [id]);
    if (categoryExists.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    // Verificar que no existe otra categoría con el mismo nombre
    const existingCategory = await pool.query('SELECT id FROM categories WHERE name = $1 AND id != $2', [name, id]);
    if (existingCategory.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una categoría con ese nombre'
      });
    }

    const result = await pool.query(`
      UPDATE categories 
      SET name = $1, description = $2, updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [name, description || '', id]);

    res.json({
      success: true,
      message: 'Categoría actualizada exitosamente',
      data: {
        category: result.rows[0]
      }
    });

    console.log('✅ Categoría actualizada:', id);

  } catch (error) {
    console.error('❌ Error al actualizar categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ===============================================
// ELIMINAR CATEGORÍA
// ===============================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que no hay productos usando esta categoría
    const productsCount = await pool.query('SELECT COUNT(*) as count FROM products WHERE category_id = $1', [id]);
    if (parseInt(productsCount.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar la categoría porque tiene productos asociados'
      });
    }

    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Categoría no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Categoría eliminada exitosamente'
    });

    console.log('✅ Categoría eliminada:', id);

  } catch (error) {
    console.error('❌ Error al eliminar categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;