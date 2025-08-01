// ===============================================
// SERVIDOR PRINCIPAL - CORREGIDO
// ===============================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
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
// MIDDLEWARES GLOBALES
// ===============================================
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ===============================================
// RUTAS DE SALUD
// ===============================================
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ===============================================
// RUTAS DE LA API
// ===============================================
app.use('/api/v1/auth', authRoutes);

// Rutas protegidas
app.use('/api/v1/products', authenticateToken, productsRoutes);
app.use('/api/v1/categories', authenticateToken, categoriesRoutes);
app.use('/api/v1/users', authenticateToken);
app.use('/api/v1/inventory', authenticateToken);
app.use('/api/v1/reports', authenticateToken);

// ===============================================
// RUTAS TEMPORALES PARA TESTING
// ===============================================
app.get('/api/v1/reports/dashboard', authenticateToken, (req, res) => {
  res.json({
    success: true,
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

// ===============================================
// MANEJO DE ERRORES 404
// ===============================================
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
    requestedUrl: req.originalUrl,
    method: req.method
  });
});

// ===============================================
// MANEJO DE ERRORES GLOBALES
// ===============================================
app.use((error, req, res, next) => {
  console.error('💥 Error no manejado:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// ===============================================
// INICIAR SERVIDOR
// ===============================================
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/v1/health`);
  console.log(`🔐 Auth endpoint: http://localhost:${PORT}/api/v1/auth/login`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/api/v1/reports/dashboard`);
});

// ===============================================
// MANEJO DE SEÑALES
// ===============================================
process.on('SIGTERM', () => {
  console.log('👋 Recibida señal SIGTERM. Cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 Recibida señal SIGINT. Cerrando servidor...');
  process.exit(0);
});