// ===============================================
// RUTAS DE CATEGORÍAS - CRUD COMPLETO
// ===============================================

const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

// ===============================================
// VALIDACIONES
// ===============================================
const categoryValidation = [
    body('name')
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('El nombre de la categoría debe tener entre 1 y 100 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-_]+$/)
        .withMessage('El nombre solo puede contener letras, números, espacios, guiones y guiones bajos'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('La descripción no puede exceder 500 caracteres')
];

const idValidation = [
    param('id').isInt({ min: 1 }).withMessage('ID debe ser un número entero válido')
];

// ===============================================
// OBTENER TODAS LAS CATEGORÍAS
// ===============================================
router.get('/', authenticateToken, async (req, res) => {
    try {
        const { include_stats = 'false' } = req.query;

        let baseQuery = `
            SELECT 
                c.id,
                c.name,
                c.description,
                c.is_active,
                c.created_at,
                c.updated_at
        `;

        if (include_stats === 'true') {
            baseQuery += `,
                COUNT(p.id) as product_count,
                COALESCE(SUM(p.quantity), 0) as total_quantity,
                COALESCE(SUM(p.price * p.quantity), 0) as total_value
            `;
        }

        baseQuery += `
            FROM categories c
        `;

        if (include_stats === 'true') {
            baseQuery += `
                LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true
            `;
        }

        baseQuery += ` WHERE c.is_active = true`;

        if (include_stats === 'true') {
            baseQuery += `
                GROUP BY c.id, c.name, c.description, c.is_active, c.created_at, c.updated_at
            `;
        }

        baseQuery += ` ORDER BY c.name ASC`;

        const result = await query(baseQuery);

        res.json({
            success: true,
            data: {
                categories: result.rows,
                count: result.rows.length
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo categorías:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===============================================
// OBTENER CATEGORÍA POR ID
// ===============================================
router.get('/:id', authenticateToken, idValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido',
                errors: errors.array()
            });
        }

        const categoryId = req.params.id;

        const result = await query(`
            SELECT 
                c.id,
                c.name,
                c.description,
                c.is_active,
                c.created_at,
                c.updated_at,
                COUNT(p.id) as product_count,
                COALESCE(SUM(p.quantity), 0) as total_quantity,
                COALESCE(SUM(p.price * p.quantity), 0) as total_value
            FROM categories c
            LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true
            WHERE c.id = $1
            GROUP BY c.id, c.name, c.description, c.is_active, c.created_at, c.updated_at
        `, [categoryId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Categoría no encontrada'
            });
        }

        const category = result.rows[0];

        res.json({
            success: true,
            data: {
                category
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo categoría:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===============================================
// CREAR CATEGORÍA
// ===============================================
router.post('/', authenticateToken, categoryValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos',
                errors: errors.array()
            });
        }

        const { name, description } = req.body;

        // Verificar si ya existe una categoría con ese nombre
        const existingCategory = await query(
            'SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND is_active = true',
            [name]
        );

        if (existingCategory.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe una categoría con ese nombre'
            });
        }

        const result = await query(
            `INSERT INTO categories (name, description)
             VALUES ($1, $2)
             RETURNING *`,
            [name, description]
        );

        const newCategory = result.rows[0];

        console.log(`✅ Categoría creada: ${name} por ${req.user.username}`);

        res.status(201).json({
            success: true,
            message: 'Categoría creada exitosamente',
            data: {
                category: newCategory
            }
        });

    } catch (error) {
        console.error('❌ Error creando categoría:', error);
        
        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                message: 'Ya existe una categoría con ese nombre'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===============================================
// ACTUALIZAR CATEGORÍA
// ===============================================
router.put('/:id', authenticateToken, [...idValidation, ...categoryValidation], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos',
                errors: errors.array()
            });
        }

        const categoryId = req.params.id;
        const { name, description } = req.body;

        // Verificar que la categoría existe
        const existingCategory = await query(
            'SELECT * FROM categories WHERE id = $1 AND is_active = true',
            [categoryId]
        );

        if (existingCategory.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Categoría no encontrada'
            });
        }

        // Verificar si ya existe otra categoría con ese nombre
        const duplicateCategory = await query(
            'SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND id != $2 AND is_active = true',
            [name, categoryId]
        );

        if (duplicateCategory.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Ya existe otra categoría con ese nombre'
            });
        }

        const result = await query(
            `UPDATE categories 
             SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
             WHERE id = $3
             RETURNING *`,
            [name, description, categoryId]
        );

        const updatedCategory = result.rows[0];

        console.log(`✅ Categoría actualizada: ${name} por ${req.user.username}`);

        res.json({
            success: true,
            message: 'Categoría actualizada exitosamente',
            data: {
                category: updatedCategory
            }
        });

    } catch (error) {
        console.error('❌ Error actualizando categoría:', error);
        
        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                message: 'Ya existe una categoría con ese nombre'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===============================================
// ELIMINAR CATEGORÍA (SOFT DELETE)
// ===============================================
router.delete('/:id', authenticateToken, idValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'ID inválido',
                errors: errors.array()
            });
        }

        const categoryId = req.params.id;

        // Verificar que la categoría existe
        const existingCategory = await query(
            'SELECT * FROM categories WHERE id = $1 AND is_active = true',
            [categoryId]
        );

        if (existingCategory.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Categoría no encontrada'
            });
        }

        // Verificar si tiene productos asociados
        const productsCount = await query(
            'SELECT COUNT(*) FROM products WHERE category_id = $1 AND is_active = true',
            [categoryId]
        );

        const productCount = parseInt(productsCount.rows[0].count);

        if (productCount > 0) {
            return res.status(400).json({
                success: false,
                message: `No se puede eliminar la categoría porque tiene ${productCount} producto(s) asociado(s). Elimina o reasigna los productos primero.`
            });
        }

        // Eliminar categoría (soft delete)
        await query(
            'UPDATE categories SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
            [categoryId]
        );

        const category = existingCategory.rows[0];
        console.log(`✅ Categoría eliminada: ${category.name} por ${req.user.username}`);

        res.json({
            success: true,
            message: 'Categoría eliminada exitosamente'
        });

    } catch (error) {
        console.error('❌ Error eliminando categoría:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;