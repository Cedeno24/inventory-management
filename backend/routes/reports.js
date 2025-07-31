// ===============================================
// RUTAS DE REPORTES Y ESTADÍSTICAS
// ===============================================

const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// ===============================================
// DASHBOARD GENERAL
// ===============================================
router.get('/dashboard', authenticateToken, async (req, res) => {
    try {
        // Estadísticas generales usando la vista creada
        const statsResult = await query('SELECT * FROM dashboard_stats');
        const stats = statsResult.rows[0];

        // Productos con stock bajo
        const lowStockResult = await query(`
            SELECT 
                p.id,
                p.name,
                p.quantity,
                p.min_stock,
                c.name as category_name,
                (p.quantity::float / p.min_stock) as stock_ratio
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.is_active = true AND p.quantity <= p.min_stock
            ORDER BY stock_ratio ASC, p.name
            LIMIT 10
        `);

        // Productos más valiosos
        const valuableProductsResult = await query(`
            SELECT 
                p.id,
                p.name,
                p.price,
                p.quantity,
                (p.price * p.quantity) as total_value,
                c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.is_active = true
            ORDER BY total_value DESC
            LIMIT 10
        `);

        // Distribución por categorías
        const categoryDistributionResult = await query(`
            SELECT 
                c.name,
                COUNT(p.id) as product_count,
                COALESCE(SUM(p.quantity), 0) as total_quantity,
                COALESCE(SUM(p.price * p.quantity), 0) as total_value
            FROM categories c
            LEFT JOIN products p ON c.id = p.category_id AND p.is_active = true
            WHERE c.is_active = true
            GROUP BY c.id, c.name
            ORDER BY total_value DESC
        `);

        // Movimientos recientes
        const recentMovementsResult = await query(`
            SELECT 
                m.id,
                m.movement_type,
                m.quantity_changed,
                m.reason,
                m.created_at,
                p.name as product_name,
                u.username
            FROM inventory_movements m
            JOIN products p ON m.product_id = p.id
            JOIN users u ON m.user_id = u.id
            ORDER BY m.created_at DESC
            LIMIT 10
        `);

        res.json({
            success: true,
            data: {
                stats: {
                    total_products: parseInt(stats.total_products),
                    total_categories: parseInt(stats.total_categories),
                    total_users: parseInt(stats.total_users),
                    total_inventory_value: parseFloat(stats.total_inventory_value),
                    low_stock_products: parseInt(stats.low_stock_products)
                },
                low_stock_products: lowStockResult.rows,
                valuable_products: valuableProductsResult.rows,
                category_distribution: categoryDistributionResult.rows,
                recent_movements: recentMovementsResult.rows
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===============================================
// REPORTE DE INVENTARIO
// ===============================================
router.get('/inventory', authenticateToken, async (req, res) => {
    try {
        const {
            category_id,
            stock_status,
            export_format = 'json'
        } = req.query;

        let whereClause = 'WHERE p.is_active = true';
        const params = [];
        let paramCount = 0;

        if (category_id) {
            paramCount++;
            whereClause += ` AND p.category_id = $${paramCount}`;
            params.push(category_id);
        }

        if (stock_status) {
            if (stock_status === 'LOW') {
                whereClause += ' AND p.quantity <= p.min_stock';
            } else if (stock_status === 'MEDIUM') {
                whereClause += ' AND p.quantity > p.min_stock AND p.quantity <= (p.min_stock * 2)';
            } else if (stock_status === 'HIGH') {
                whereClause += ' AND p.quantity > (p.min_stock * 2)';
            }
        }

        const result = await query(`
            SELECT 
                p.id,
                p.name,
                p.description,
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
                p.created_at,
                u.username as created_by_username
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            LEFT JOIN users u ON p.created_by = u.id
            ${whereClause}
            ORDER BY p.name
        `, params);

        // Calcular resumen
        const summary = {
            total_products: result.rows.length,
            total_value: result.rows.reduce((sum, product) => sum + parseFloat(product.total_value), 0),
            total_quantity: result.rows.reduce((sum, product) => sum + parseInt(product.quantity), 0),
            low_stock_count: result.rows.filter(p => p.stock_status === 'LOW').length,
            medium_stock_count: result.rows.filter(p => p.stock_status === 'MEDIUM').length,
            high_stock_count: result.rows.filter(p => p.stock_status === 'HIGH').length
        };

        res.json({
            success: true,
            data: {
                products: result.rows,
                summary,
                filters: {
                    category_id,
                    stock_status
                },
                generated_at: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Error generando reporte de inventario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===============================================
// REPORTE DE MOVIMIENTOS
// ===============================================
router.get('/movements', authenticateToken, async (req, res) => {
    try {
        const {
            product_id,
            movement_type,
            page = 1,
            limit = 50
        } = req.query;

        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(200, Math.max(1, parseInt(limit)));
        const offset = (pageNum - 1) * limitNum;

        let whereClause = 'WHERE 1=1';
        const params = [];
        let paramCount = 0;

        if (movement_type) {
            paramCount++;
            whereClause += ` AND m.movement_type = $${paramCount}`;
            params.push(movement_type.toUpperCase());
        }

        if (product_id) {
            paramCount++;
            whereClause += ` AND m.product_id = $${paramCount}`;
            params.push(product_id);
        }

        // Obtener movimientos
        const result = await query(`
            SELECT 
                m.id,
                m.movement_type,
                m.quantity_before,
                m.quantity_after,
                m.quantity_changed,
                m.reason,
                m.notes,
                m.created_at,
                p.name as product_name,
                c.name as category_name,
                u.username
            FROM inventory_movements m
            JOIN products p ON m.product_id = p.id
            LEFT JOIN categories c ON p.category_id = c.id
            JOIN users u ON m.user_id = u.id
            ${whereClause}
            ORDER BY m.created_at DESC
            LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
        `, [...params, limitNum, offset]);

        // Contar total
        const countResult = await query(`
            SELECT COUNT(*)
            FROM inventory_movements m
            JOIN products p ON m.product_id = p.id
            JOIN users u ON m.user_id = u.id
            ${whereClause}
        `, params);

        const total = parseInt(countResult.rows[0].count);
        const totalPages = Math.ceil(total / limitNum);

        res.json({
            success: true,
            data: {
                movements: result.rows,
                pagination: {
                    current_page: pageNum,
                    total_pages: totalPages,
                    total_items: total,
                    items_per_page: limitNum,
                    has_next: pageNum < totalPages,
                    has_previous: pageNum > 1
                },
                filters: {
                    movement_type,
                    product_id
                }
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo reporte de movimientos:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===============================================
// ESTADÍSTICAS RÁPIDAS
// ===============================================
router.get('/stats', authenticateToken, async (req, res) => {
    try {
        const result = await query(`
            SELECT 
                COUNT(*) as total_products,
                SUM(quantity) as total_quantity,
                SUM(price * quantity) as total_inventory_value,
                AVG(price) as average_price,
                COUNT(CASE WHEN quantity <= min_stock THEN 1 END) as low_stock_count
            FROM products 
            WHERE is_active = true
        `);

        const stats = result.rows[0];

        res.json({
            success: true,
            data: {
                total_products: parseInt(stats.total_products),
                total_quantity: parseInt(stats.total_quantity),
                total_inventory_value: parseFloat(stats.total_inventory_value || 0),
                average_price: parseFloat(stats.average_price || 0),
                low_stock_count: parseInt(stats.low_stock_count)
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;