// ===============================================
// MIDDLEWARE DE AUTENTICACIÓN
// ===============================================

const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// ===============================================
// MIDDLEWARE PARA VERIFICAR TOKEN JWT
// ===============================================
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    console.log('🔍 Verificando token...', token ? 'Token presente' : 'Sin token');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    console.log('✅ Token válido para usuario:', decoded.userId);

    // Verificar que el usuario aún existe y está activo
    const result = await pool.query(
      'SELECT id, username, email, role, is_active FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado o inactivo'
      });
    }

    // Agregar información del usuario al request
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      userData: result.rows[0]
    };

    next();

  } catch (error) {
    console.error('❌ Error al verificar token:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// ===============================================
// MIDDLEWARE PARA VERIFICAR ROLES
// ===============================================
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'No autorizado'
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      console.log(`❌ Acceso denegado. Usuario rol: ${userRole}, Roles permitidos: ${allowedRoles.join(', ')}`);
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso'
      });
    }

    console.log(`✅ Acceso permitido. Usuario rol: ${userRole}`);
    next();
  };
};

// ===============================================
// MIDDLEWARE SOLO PARA ADMIN
// ===============================================
const requireAdmin = requireRole(['admin']);

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin
};