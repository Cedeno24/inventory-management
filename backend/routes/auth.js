// ===============================================
// RUTAS DE AUTENTICACIÓN - CORREGIDAS
// ===============================================

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ===============================================
// RUTA DE LOGIN CON DEBUG MEJORADO
// ===============================================
router.post('/login', [
  body('email').isEmail().withMessage('Debe ser un email válido'),
  body('password').notEmpty().withMessage('La contraseña es requerida'),
], async (req, res) => {
  try {
    console.log('🔄 Iniciando proceso de login...');
    console.log('📧 Datos recibidos:', { email: req.body.email, hasPassword: !!req.body.password });
    
    // Validar errores de entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Errores de validación:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Buscar usuario por email
    const query = 'SELECT id, username, email, password, role, is_active FROM users WHERE email = $1 AND is_active = true';
    console.log('🔍 Buscando usuario con email:', email);
    
    const result = await pool.query(query, [email]);
    console.log('📊 Usuario encontrado:', result.rows.length > 0);

    if (result.rows.length === 0) {
      console.log('❌ Usuario no encontrado o inactivo');
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const user = result.rows[0];
    console.log('👤 Usuario:', {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      hasStoredPassword: !!user.password
    });

    // Verificar contraseña
    console.log('🔄 Verificando contraseña...');
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('✅ Contraseña válida:', isValidPassword);

    if (!isValidPassword) {
      console.log('❌ Contraseña incorrecta');
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Generar tokens JWT
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h'
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret', {
      expiresIn: '7d'
    });

    console.log('🎟️ Tokens generados exitosamente');

    // Respuesta exitosa
    const response = {
      success: true,
      message: 'Login exitoso',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.is_active
      },
      accessToken,
      refreshToken
    };

    console.log('✅ Enviando respuesta exitosa');
    res.json(response);

  } catch (error) {
    console.error('💥 Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ===============================================
// RUTA DE REGISTRO
// ===============================================
router.post('/register', [
  body('username').isLength({ min: 3, max: 50 }).withMessage('El nombre de usuario debe tener entre 3 y 50 caracteres'),
  body('email').isEmail().withMessage('Debe ser un email válido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
], async (req, res) => {
  try {
    console.log('🔄 Iniciando proceso de registro...');

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }

    const { username, email, password } = req.body;
    console.log('📧 Registrando usuario:', { username, email });

    // Verificar si el usuario ya existe
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      console.log('❌ Usuario ya existe');
      return res.status(409).json({
        success: false,
        message: 'El usuario o email ya existe'
      });
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('🔒 Contraseña hasheada');

    // Insertar nuevo usuario
    const newUser = await pool.query(
      'INSERT INTO users (username, email, password, role, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id, username, email, role',
      [username, email, hashedPassword, 'user', true]
    );

    const user = newUser.rows[0];
    console.log('✅ Usuario creado:', user.id);

    // Generar tokens
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', {
      expiresIn: '24h'
    });

    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret', {
      expiresIn: '7d'
    });

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: true
      },
      accessToken,
      refreshToken
    });

    console.log('✅ Usuario registrado exitosamente:', user.email);

  } catch (error) {
    console.error('💥 Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ===============================================
// RUTA PARA OBTENER PERFIL - CORREGIDA
// ===============================================
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    console.log('🔄 Obteniendo perfil del usuario:', req.user.userId);
    
    const result = await pool.query(
      'SELECT id, username, email, role, is_active, created_at, updated_at FROM users WHERE id = $1 AND is_active = true',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      console.log('❌ Usuario no encontrado');
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const userData = result.rows[0];
    console.log('✅ Perfil obtenido:', userData.email);

    res.json({
      success: true,
      message: 'Perfil obtenido exitosamente',
      data: {
        user: {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          role: userData.role,
          isActive: userData.is_active,
          createdAt: userData.created_at,
          updatedAt: userData.updated_at
        }
      }
    });

  } catch (error) {
    console.error('💥 Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ===============================================
// RUTA DE REFRESH TOKEN
// ===============================================
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token requerido'
      });
    }

    // Verificar refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret');

    // Verificar que el usuario aún existe
    const result = await pool.query(
      'SELECT id, username, email, role FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Generar nuevo access token
    const user = result.rows[0];
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };

    const newAccessToken = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret', {
      expiresIn: '24h'
    });

    res.json({
      success: true,
      accessToken: newAccessToken
    });

  } catch (error) {
    console.error('Error al renovar token:', error);
    res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
});

// ===============================================
// RUTA DE LOGOUT
// ===============================================
router.post('/logout', (req, res) => {
  console.log('🚪 Logout solicitado');
  res.json({
    success: true,
    message: 'Logout exitoso'
  });
});

// ===============================================
// RUTA DE VERIFICACIÓN (para debug)
// ===============================================
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token válido',
    user: req.user
  });
});

module.exports = router;