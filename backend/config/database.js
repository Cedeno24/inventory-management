// ===============================================
// CONFIGURACIÓN DE BASE DE DATOS - PostgreSQL
// ===============================================

const { Pool } = require('pg');
require('dotenv').config();

// Configuración de la base de datos
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'inventory_system',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Manejar eventos de conexión
pool.on('connect', () => {
  console.log('🔗 Nueva conexión establecida con PostgreSQL');
});

pool.on('error', (err) => {
  console.error('💥 Error en la conexión a PostgreSQL:', err);
  process.exit(-1);
});

// Función para ejecutar queries con logging
const originalQuery = pool.query;
pool.query = function(...args) {
  const start = Date.now();
  
  return originalQuery.apply(this, args).then(result => {
    const duration = Date.now() - start;
    console.log('🔍 Query ejecutado:', {
      text: args[0]?.substring ? args[0].substring(0, 50) + '...' : args[0],
      duration: `${duration}ms`,
      rows: result.rowCount
    });
    return result;
  }).catch(error => {
    const duration = Date.now() - start;
    console.error('❌ Error en query:', {
      text: args[0]?.substring ? args[0].substring(0, 50) + '...' : args[0],
      duration: `${duration}ms`,
      error: error.message
    });
    throw error;
  });
};

// Probar la conexión
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Error al conectar con PostgreSQL:', err.stack);
    return;
  }
  console.log('✅ Conectado a PostgreSQL exitosamente');
  release();
});

module.exports = pool;