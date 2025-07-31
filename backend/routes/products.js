// ===============================================
// RUTAS DE PRODUCTOS - CRUD COMPLETO
// ===============================================

const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { query, transaction } = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

// ===============================================
// VALIDACIONES
// ===============================================
const productValidation = [
    body('name')
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('El nombre del producto debe tener entre 1 y 200 caracteres'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('La descripción no puede exceder 1000 caracteres'),
    body('category_id')
        .isInt({ min: 1 })
        .withMessage('ID de categoría debe ser un número entero válido'),
    body('price')
        .isFloat({ min: 0 })
        .withMessage('El precio debe ser un número mayor o igual a 0'),
    body('quantity')
        .isInt({ min: 0 })
        .withMessage('La cantidad debe ser un número entero mayor o igual a 0'),
    body('min_stock')
        .optional()
        .isInt({ min: 0 })
        .withMessage('El stock mínimo debe ser un número entero mayor o igual a 0'),
    body('barcode')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('El código de barras no puede exceder 50 caracteres')
];

const idValidation = [
    param('id').isInt({ min: 1 }).withMessage('ID debe ser un número entero válido')
];

// ===============================================
// FUNCIONES AUXILIARES
// ===============================================
const recordMovement = async (client, productId, userId, movementType, quantityBefore, quantityAfter, reason = null) => {
    const quantityChanged = quantityAfter - quantityBefore;
    
    await client.query(
        `INSERT INTO inventory_movements 
         (product_id, user_id, movement_type, quantity_before, quantity_after, quantity_changed, reason)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [productId, userId, movementType, quantityBefore, quantityAfter, quantityChanged, reason]
    );
};

// ===============================================
// OBTENER PRODUCTOS CON STOCK BAJO (DEBE IR ANTES DE /:id)
// ===============================================
router.get('/reports/low-stock', authenticateToken, async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                p.id,
                p.name,
                p.quantity,
                p.min_stock,
                c.name as category_name,
                p.price,
                (p.price * p.quantity) as total_value
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.is_active = true AND p.quantity <= p.min_stock
            ORDER BY (p.quantity::float / p.min_stock) ASC, p.name
        `);

        res.json({
            success: true,
            data: {
                products: result.rows,
                count: result.rows.length
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo productos con stock bajo:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===============================================
// OBTENER TODOS LOS PRODUCTOS
// ===============================================
router.get('/', authenticateToken, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            category_id,
            stock_status
        } = req.query;

        // Validar parámetros
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
        const offset = (pageNum - 1) * limitNum;

        // Construir query base
        let baseQuery = `
            SELECT 
                p.id,
                p.name,
                p.description,
                p.category_id,
                c.name as category_name,
                p.price,
                p.quantity,
                p.min_stock,
                (p.price * p.quantity) as total_value,
                CASE 
                    WHEN p.quantity <= p.min_stock THEN 'LOW'
                    WHEN p.quantity <= (p.min_stock * 2) THEN 'MEDIUM'
                    ELSE 'HIGH'
                END as stock_status,
                p.barcode,
                p.is_active,
                u.username as created_by_username,
                p.created_at,
                p.updated_at
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN users u ON p.created_by = u.id
            WHERE p.is_active = true
        `;

        const conditions = [];
        const params = [];
        let paramCount = 0;

        // Aplicar filtros
        if (search) {
            paramCount++;
            conditions.push(`(p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount})`);
            params.push(`%${search}%`);
        }

        if (category_id) {
            paramCount++;
            conditions.push(`p.category_id = $${paramCount}`);
            params.push(parseInt(category_id));
        }

        if (stock_status) {
            if (stock_status === 'LOW') {
                conditions.push(`p.quantity <= p.min_stock`);
            } else if (stock_status === 'MEDIUM') {
                conditions.push(`p.quantity > p.min_stock AND p.quantity <= (p.min_stock * 2)`);
            } else if (stock_status === 'HIGH') {
                conditions.push(`p.quantity > (p.min_stock * 2)`);
            }
        }

        if (conditions.length > 0) {
            baseQuery += ' AND ' + conditions.join(' AND ');
        }

        // Contar total de productos
        const countQuery = baseQuery.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) FROM');
        const countResult = await query(countQuery, params);
        const total = parseInt(countResult.rows[0].count);

        // Obtener productos con paginación
        const finalQuery = `
            ${baseQuery}
            ORDER BY p.created_at DESC
            LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
        `;

        const result = await query(finalQuery, [...params, limitNum, offset]);

        // Calcular metadatos de paginación
        const totalPages = Math.ceil(total / limitNum);

        res.json({
            success: true,
            data: {
                products: result.rows,
                pagination: {
                    current_page: pageNum,
                    total_pages: totalPages,
                    total_items: total,
                    items_per_page: limitNum,
                    has_next: pageNum < totalPages,
                    has_previous: pageNum > 1
                },
                filters: {
                    search,
                    category_id,
                    stock_status
                }
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo productos:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===============================================
// OBTENER PRODUCTO POR ID
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

        const productId = req.params.id;

        const result = await query(`
            SELECT 
                p.id,
                p.name,
                p.description,
                p.category_id,
                c.name as category_name,
                p.price,
                p.quantity,
                p.min_stock,
                (p.price * p.quantity) as total_value,
                CASE 
                    WHEN p.quantity <= p.min_stock THEN 'LOW'
                    WHEN p.quantity <= (p.min_stock * 2) THEN 'MEDIUM'
                    ELSE 'HIGH'
                END as stock_status,
                p.barcode,
                p.is_active,
                p.created_by,
                u.username as created_by_username,
                p.created_at,
                p.updated_at
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN users u ON p.created_by = u.id
            WHERE p.id = $1 AND p.is_active = true
        `, [productId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        const product = result.rows[0];

        res.json({
            success: true,
            data: {
                product
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo producto:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===============================================
// CREAR PRODUCTO
// ===============================================
router.post('/', authenticateToken, productValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos',
                errors: errors.array()
            });
        }

        const {
            name,
            description,
            category_id,
            price,
            quantity,
            min_stock = 10,
            barcode
        } = req.body;

        // Verificar que la categoría existe
        const categoryExists = await query(
            'SELECT id FROM categories WHERE id = $1 AND is_active = true',
            [category_id]
        );

        if (categoryExists.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'La categoría especificada no existe'
            });
        }

        // Verificar si el código de barras ya existe (si se proporciona)
        if (barcode) {
            const barcodeExists = await query(
                'SELECT id FROM products WHERE barcode = $1 AND is_active = true',
                [barcode]
            );

            if (barcodeExists.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'El código de barras ya está en uso'
                });
            }
        }

        const result = await transaction(async (client) => {
            // Crear producto
            const productResult = await client.query(
                `INSERT INTO products 
                 (name, description, category_id, price, quantity, min_stock, barcode, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                 RETURNING *`,
                [name, description, category_id, price, quantity, min_stock, barcode, req.user.id]
            );

            const newProduct = productResult.rows[0];

            // Registrar movimiento
            await recordMovement(
                client,
                newProduct.id,
                req.user.id,
                'CREATE',
                0,
                quantity,
                'Producto creado'
            );

            return newProduct;
        });

        console.log(`✅ Producto creado: ${name} por ${req.user.username}`);

        res.status(201).json({
            success: true,
            message: 'Producto creado exitosamente',
            data: {
                product: result
            }
        });

    } catch (error) {
        console.error('❌ Error creando producto:', error);
        
        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                message: 'Ya existe un producto con ese código de barras'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===============================================
// ACTUALIZAR PRODUCTO
// ===============================================
router.put('/:id', authenticateToken, [...idValidation, ...productValidation], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos',
                errors: errors.array()
            });
        }

        const productId = req.params.id;
        const {
            name,
            description,
            category_id,
            price,
            quantity,
            min_stock,
            barcode
        } = req.body;

        // Verificar que el producto existe
        const existingProduct = await query(
            'SELECT * FROM products WHERE id = $1 AND is_active = true',
            [productId]
        );

        if (existingProduct.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        const currentProduct = existingProduct.rows[0];

        // Verificar permisos (usuarios solo pueden editar sus productos, admin puede editar todos)
        if (req.user.role !== 'admin' && currentProduct.created_by !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para modificar este producto'
            });
        }

        // Verificar que la categoría existe
        const categoryExists = await query(
            'SELECT id FROM categories WHERE id = $1 AND is_active = true',
            [category_id]
        );

        if (categoryExists.rows.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'La categoría especificada no existe'
            });
        }

        // Verificar código de barras único (si se proporciona y cambió)
        if (barcode && barcode !== currentProduct.barcode) {
            const barcodeExists = await query(
                'SELECT id FROM products WHERE barcode = $1 AND id != $2 AND is_active = true',
                [barcode, productId]
            );

            if (barcodeExists.rows.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'El código de barras ya está en uso'
                });
            }
        }

        const result = await transaction(async (client) => {
            // Actualizar producto
            const updateResult = await client.query(
                `UPDATE products 
                 SET name = $1, description = $2, category_id = $3, price = $4, 
                     quantity = $5, min_stock = $6, barcode = $7,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $8
                 RETURNING *`,
                [name, description, category_id, price, quantity, min_stock, barcode, productId]
            );

            const updatedProduct = updateResult.rows[0];

            // Registrar movimiento si cambió la cantidad
            if (quantity !== currentProduct.quantity) {
                await recordMovement(
                    client,
                    productId,
                    req.user.id,
                    'UPDATE',
                    currentProduct.quantity,
                    quantity,
                    'Producto actualizado'
                );
            }

            return updatedProduct;
        });

        console.log(`✅ Producto actualizado: ${name} por ${req.user.username}`);

        res.json({
            success: true,
            message: 'Producto actualizado exitosamente',
            data: {
                product: result
            }
        });

    } catch (error) {
        console.error('❌ Error actualizando producto:', error);
        
        if (error.code === '23505') {
            return res.status(409).json({
                success: false,
                message: 'Ya existe un producto con ese código de barras'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===============================================
// ELIMINAR PRODUCTO (SOFT DELETE)
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

        const productId = req.params.id;

        // Verificar que el producto existe
        const existingProduct = await query(
            'SELECT * FROM products WHERE id = $1 AND is_active = true',
            [productId]
        );

        if (existingProduct.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Producto no encontrado'
            });
        }

        const product = existingProduct.rows[0];

        // Verificar permisos
        if (req.user.role !== 'admin' && product.created_by !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para eliminar este producto'
            });
        }

        await transaction(async (client) => {
            // Soft delete del producto
            await client.query(
                'UPDATE products SET is_active = false, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
                [productId]
            );

            // Registrar movimiento
            await recordMovement(
                client,
                productId,
                req.user.id,
                'DELETE',
                product.quantity,
                0,
                'Producto eliminado'
            );
        });

        console.log(`✅ Producto eliminado: ${product.name} por ${req.user.username}`);

        res.json({
            success: true,
            message: 'Producto eliminado exitosamente'
        });

    } catch (error) {
        console.error('❌ Error eliminando producto:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;