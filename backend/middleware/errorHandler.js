// ===============================================
// MIDDLEWARE DE MANEJO DE ERRORES
// ===============================================

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log del error
    console.error('❌ Error capturado:', err);

    // Error de validación de PostgreSQL
    if (err.code === '23505') { // Unique violation
        const message = 'Recurso duplicado. Ya existe un registro con esos datos.';
        error = {
            statusCode: 409,
            message
        };
    }

    // Error de foreign key constraint (PostgreSQL)
    if (err.code === '23503') {
        const message = 'No se puede completar la operación. Referencia inválida.';
        error = {
            statusCode: 400,
            message
        };
    }

    // Error de conexión a base de datos
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        const message = 'Error de conexión a la base de datos';
        error = {
            statusCode: 503,
            message
        };
    }

    // JWT Error
    if (err.name === 'JsonWebTokenError') {
        const message = 'Token inválido';
        error = {
            statusCode: 401,
            message
        };
    }

    // JWT Expired Error
    if (err.name === 'TokenExpiredError') {
        const message = 'Token expirado';
        error = {
            statusCode: 401,
            message
        };
    }

    // Error de validación (express-validator)
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message);
        error = {
            statusCode: 400,
            message: message.join(', ')
        };
    }

    res.status(error.statusCode || 500).json({
        success: false,
        error: error.message || 'Error interno del servidor',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

// ===============================================
// MIDDLEWARE PARA RUTAS NO ENCONTRADAS
// ===============================================
const notFound = (req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
        available_endpoints: {
            auth: '/api/v1/auth',
            products: '/api/v1/products',
            categories: '/api/v1/categories',
            reports: '/api/v1/reports',
            users: '/api/v1/users'
        }
    });
};

module.exports = {
    errorHandler,
    notFound
};