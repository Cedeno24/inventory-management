// ===============================================
// CONFIGURACIÓN DE BASE DE DATOS POSTGRESQL
// ===============================================

const { Pool } = require('pg');

// ===============================================
// CONFIGURACIÓN DE CONEXIÓN
// ===============================================
const poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'inventory_management',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 20, // máximo de conexiones en el pool
    idleTimeoutMillis: 30000, // tiempo antes de cerrar conexiones inactivas
    connectionTimeoutMillis: 2000, // tiempo máximo para establecer conexión
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

// Crear pool de conexiones
const pool = new Pool(poolConfig);

// ===============================================
// EVENTOS DEL POOL
// ===============================================
pool.on('connect', (client) => {
    console.log('🔗 Nueva conexión establecida con PostgreSQL');
});

pool.on('error', (err, client) => {
    console.error('❌ Error inesperado en el cliente de PostgreSQL:', err);
});

// ===============================================
// FUNCIONES DE CONEXIÓN
// ===============================================

/**
 * Conectar a la base de datos y verificar conexión
 */
const connectDB = async () => {
    try {
        const client = await pool.connect();
        console.log('🔍 Verificando conexión a PostgreSQL...');
        
        const result = await client.query('SELECT NOW() as current_time, version() as version');
        console.log('✅ Conectado a PostgreSQL exitosamente');
        console.log(`📅 Tiempo del servidor: ${result.rows[0].current_time}`);
        console.log(`🗄️  Versión: ${result.rows[0].version.split(' ').slice(0, 2).join(' ')}`);
        
        client.release();
        return true;
    } catch (error) {
        console.error('❌ Error conectando a PostgreSQL:', error.message);
        throw error;
    }
};

/**
 * Ejecutar query con manejo de errores
 */
const query = async (text, params) => {
    const start = Date.now();
    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;
        
        if (process.env.NODE_ENV === 'development') {
            console.log('🔍 Query ejecutado:', { 
                text: text.substring(0, 50) + '...', 
                duration: `${duration}ms`, 
                rows: res.rowCount 
            });
        }
        
        return res;
    } catch (error) {
        console.error('❌ Error en query:', error.message);
        console.error('📝 Query:', text);
        if (params) console.error('📋 Parámetros:', params);
        throw error;
    }
};

/**
 * Obtener cliente del pool para transacciones
 */
const getClient = async () => {
    return await pool.connect();
};

/**
 * Ejecutar transacción
 */
const transaction = async (callback) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        console.log('🔄 Transacción iniciada');
        
        const result = await callback(client);
        
        await client.query('COMMIT');
        console.log('✅ Transacción confirmada');
        
        return result;
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Transacción revertida:', error.message);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Cerrar pool de conexiones
 */
const closeDB = async () => {
    try {
        await pool.end();
        console.log('🔒 Pool de conexiones cerrado');
    } catch (error) {
        console.error('❌ Error cerrando pool:', error.message);
        throw error;
    }
};

/**
 * Verificar si existe una tabla
 */
const tableExists = async (tableName) => {
    try {
        const result = await query(
            `SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = $1
            )`,
            [tableName]
        );
        return result.rows[0].exists;
    } catch (error) {
        console.error(`❌ Error verificando tabla ${tableName}:`, error.message);
        return false;
    }
};

// ===============================================
// EXPORTAR FUNCIONES
// ===============================================
module.exports = {
    pool,
    connectDB,
    query,
    getClient,
    transaction,
    closeDB,
    tableExists
};