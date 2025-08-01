// ===============================================
// SERVIDOR PRINCIPAL - CONFIGURACIÓN CORREGIDA
// ===============================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Importar rutas
const authRoutes = require('./routes/auth');
const productsRoutes = require('./routes/products');
const categoriesRoutes = require('./routes/categories');
const { authenticateToken } = require('./middleware/auth');

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 5000;

// ===============================================
// LOGGING MEJORADO
// ===============================================
console.log('🚀 Iniciando servidor...');
console.log('📍 Puerto:', PORT);
console.log('🌍 Entorno:', process.env.NODE_ENV || 'development');
console.log('🔐 JWT Secret configurado:', !!process.env.JWT_SECRET);

// ===============================================
// MIDDLEWARES GLOBALES
// ===============================================

// Helmet para seguridad
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Morgan para logging de requests
app.use(morgan('combined'));

// CORS configurado correctamente
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['X-Total-Count']
}));

// Parsear JSON y URL-encoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging personalizado
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
  
  if (req.headers.authorization) {
    console.log('🔑 Authorization header presente');
  }
  
  next();
});

// ===============================================
// RUTAS DE SALUD Y DEBUG
// ===============================================
app.get('/api/v1/health', (req, res) => {
  const healthData = {
    status: 'OK',
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    features: {
      database: !!process.env.DATABASE_URL,
      jwt: !!process.env.JWT_SECRET,
      cors: true
    }
  };
  
  console.log('🏥 Health check solicitado');
  res.json(healthData);
});

// Endpoint de debug para verificar configuración
app.get('/api/v1/debug', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({ message: 'Not found' });
  }
  
  res.json({
    environment: process.env.NODE_ENV,
    port: PORT,
    hasJwtSecret: !!process.env.JWT_SECRET,
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// RUTAS DE LA API
// ===============================================

// Rutas de autenticación (públicas)
app.use('/api/v1/auth', authRoutes);

// Middleware de logging para rutas protegidas
app.use('/api/v1/*', (req, res, next) => {
  if (req.path !== '/api/v1/auth/login' && req.path !== '/api/v1/auth/register' && req.path !== '/api/v1/health') {
    console.log('🔒 Accediendo a ruta protegida:', req.path);
  }
  next();
});

// Rutas protegidas con autenticación
app.use('/api/v1/products', authenticateToken, productsRoutes);
app.use('/api/v1/categories', authenticateToken, categoriesRoutes);

// Rutas temporales para testing y desarrollo
app.get('/api/v1/reports/dashboard', authenticateToken, (req, res) => {
  console.log('📊 Dashboard solicitado por usuario:', req.user.userId);
  
  res.json({
    success: true,
    message: 'Dashboard data obtenida exitosamente',
    data: {
      stats: {
        total_products: 0,
        total_categories: 0,
        total_users: 1,
        total_inventory_value: 0,
        low_stock_products: 0
      },
      low_stock_products: [],
      valuable_products: [],
      category_distribution: [],
      recent_movements: []
    }
  });
});

// Placeholder para otras rutas protegidas
app.use('/api/v1/users', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Ruta de usuarios en construcción',
    data: []
  });
});

app.use('/api/v1/inventory', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Ruta de inventario en construcción',
    data: []
  });
});

// ===============================================
// MANEJO DE ERRORES 404
// ===============================================
app.use('*', (req, res) => {
  console.log('❌ Ruta no encontrada:', req.method, req.originalUrl);
  
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    requestedUrl: req.originalUrl,
    method: req.method,
    availableEndpoints: {
      auth: {
        login: 'POST /api/v1/auth/login',
        register: 'POST /api/v1/auth/register',
        profile: 'GET /api/v1/auth/profile',
        logout: 'POST /api/v1/auth/logout'
      },
      protected: {
        dashboard: 'GET /api/v1/reports/dashboard',
        products: 'GET /api/v1/products',
        categories: 'GET /api/v1/categories'
      },
      utility: {
        health: 'GET /api/v1/health',
        debug: 'GET /api/v1/debug (development only)'
      }
    }
  });
});

// ===============================================
// MANEJO DE ERRORES GLOBALES
// ===============================================
app.use((error, req, res, next) => {
  console.error('💥 Error no manejado:', {
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  // No exponer detalles del error en producción
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Error interno del servidor',
    ...(isDevelopment && { 
      stack: error.stack,
      details: error 
    })
  });
});

// ===============================================
// INICIAR SERVIDOR
// ===============================================
const server = app.listen(PORT, () => {
  console.log('');
  console.log('🚀 ====================================');
  console.log('🚀 SERVIDOR INICIADO EXITOSAMENTE');
  console.log('🚀 ====================================');
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/v1/health`);
  console.log(`🔐 Login: POST http://localhost:${PORT}/api/v1/auth/login`);
  console.log(`📊 Dashboard: GET http://localhost:${PORT}/api/v1/reports/dashboard`);
  console.log(`🐛 Debug: http://localhost:${PORT}/api/v1/debug`);
  console.log('🚀 ====================================');
  console.log('');
});

// ===============================================
// MANEJO DE SEÑALES Y ERRORES DE PROCESO
// ===============================================
process.on('SIGTERM', () => {
  console.log('👋 Recibida señal SIGTERM. Cerrando servidor gracefully...');
  server.close(() => {
    console.log('✅ Servidor cerrado exitosamente');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('👋 Recibida señal SIGINT. Cerrando servidor gracefully...');
  server.close(() => {
    console.log('✅ Servidor cerrado exitosamente');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

// ===============================================
// EXPORT PARA TESTING
// ===============================================
module.exports = app;