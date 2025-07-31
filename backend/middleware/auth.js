// ===============================================
// MIDDLEWARE DE AUTENTICACIÓN Y AUTORIZACIÓN
// ===============================================

const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// ===============================================
// VERIFICAR TOKEN JWT
// ===============================================
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Token de acceso requerido'
            });
        }

        // Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Obtener información del usuario
        const userResult = await query(
            'SELECT id, username, email, role, is_active FROM users WHERE id = $1',
            [decoded.userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const user = userResult.rows[0];

        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                message: 'Cuenta desactivada'
            });
        }

        // Agregar usuario a la request
        req.user = user;
        next();

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token inválido'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado'
            });
        }

        console.error('Error en autenticación:', error);
        return res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// ===============================================
// VERIFICAR ROL DE USUARIO
// ===============================================
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no autenticado'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para realizar esta acción'
            });
        }

        next();
    };
};

// ===============================================
// MIDDLEWARE OPCIONAL DE AUTENTICACIÓN
// ===============================================
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const userResult = await query(
                'SELECT id, username, email, role, is_active FROM users WHERE id = $1',
                [decoded.userId]
            );

            if (userResult.rows.length > 0 && userResult.rows[0].is_active) {
                req.user = userResult.rows[0];
            }
        }

        next();
    } catch (error) {
        // En caso de error, continuar sin usuario autenticado
        next();
    }
};

module.exports = {
    authenticateToken,
    authorizeRoles,
    optionalAuth
};