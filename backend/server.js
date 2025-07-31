// ===============================================
// SERVIDOR PRINCIPAL - SISTEMA DE INVENTARIO
// ===============================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { connectDB } = require('./config/database');
const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');
const reportRoutes = require('./routes/reports');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// ===============================================
// CONFIGURACIÓN DE LA APLICACIÓN
// ===============================================
const app = express();
const PORT = process.env.PORT || 5000;

// ===============================================
// MIDDLEWARE DE SEGURIDAD
// ===============================================

// Helmet para seguridad HTTP
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // máximo 100 requests por ventana
    message: {
        success: false,
        error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// ===============================================
// MIDDLEWARE GENERAL
// ===============================================

// Compresión
app.use(compression());

// CORS
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parsing del body
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Servir archivos estáticos
app.use('/uploads', express.static('uploads'));

// ===============================================
// RUTAS DE SALUD Y INFORMACIÓN
// ===============================================

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Servidor funcionando correctamente',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        version: process.env.API_VERSION || 'v1'
    });
});

// Información de la API
app.get('/api', (req, res) => {
    res.json({
        message: 'API del Sistema de Gestión de Inventario',
        version: process.env.API_VERSION || 'v1',
        endpoints: {
            auth: '/api/v1/auth',
            categories: '/api/v1/categories',
            products: '/api/v1/products',
            reports: '/api/v1/reports'
        },
        documentation: '/api/docs'
    });
});

// ===============================================
// RUTAS DE LA API
// ===============================================
const API_PREFIX = `/api/${process.env.API_VERSION || 'v1'}`;

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/categories`, categoryRoutes);
app.use(`${API_PREFIX}/products`, productRoutes);
app.use(`${API_PREFIX}/reports`, reportRoutes);

// ===============================================
// MIDDLEWARE DE MANEJO DE ERRORES
// ===============================================
app.use(notFound);
app.use(errorHandler);

// ===============================================
// INICIALIZACIÓN DEL SERVIDOR
// ===============================================
const startServer = async () => {
    try {
        // Conectar a la base de datos
        await connectDB();
        console.log('✅ Conexión a PostgreSQL establecida exitosamente');

        // Crear directorio de uploads si no existe
        const fs = require('fs');
        const path = require('path');
        const uploadsDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
            console.log('📁 Directorio de uploads creado');
        }

        // Iniciar servidor
        const server = app.listen(PORT, () => {
            console.log('');
            console.log('🚀 ================================');
            console.log('🚀 SISTEMA DE INVENTARIO - BACKEND');
            console.log('🚀 ================================');
            console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
            console.log(`🚀 Entorno: ${process.env.NODE_ENV}`);
            console.log(`🚀 API URL: http://localhost:${PORT}${API_PREFIX}`);
            console.log(`🚀 Health Check: http://localhost:${PORT}/health`);
            console.log(`🚀 Base de datos: PostgreSQL conectada`);
            console.log('🚀 ================================');
            console.log('');
        });

        // Manejo graceful de cierre
        process.on('SIGTERM', () => {
            console.log('🛑 SIGTERM recibido, cerrando servidor...');
            server.close(() => {
                console.log('🛑 Servidor cerrado');
                process.exit(0);
            });
        });

        process.on('SIGINT', () => {
            console.log('🛑 SIGINT recibido, cerrando servidor...');
            server.close(() => {
                console.log('🛑 Servidor cerrado');
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('❌ Error iniciando servidor:', error.message);
        console.error('❌ Verifica que PostgreSQL esté funcionando y las credenciales sean correctas');
        process.exit(1);
    }
};

// ===============================================
// MANEJO DE ERRORES NO CAPTURADOS
// ===============================================
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection en:', promise, 'razón:', reason);
    process.exit(1);
});

// Iniciar servidor
startServer();

module.exports = app;