// ===============================================
// RUTAS DE AUTENTICACIÓN - CORREGIDO
// ===============================================

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');

const router = express.Router();

// ===============================================
// RUTA DE LOGIN CON DEBUG
// ===============================================
router.post('/login', [
  body('email').isEmail().withMessage('Debe ser un email válido'),
  body('password').notEmpty().withMessage('La contraseña es requerida'),
], async (req, res) => {
  try {
    console.log('🔄 Iniciando proceso de login...');
    
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
    console.log('📧 Email recibido:', email);
    console.log('🔑 Password recibido:', password ? '[PRESENTE]' : '[AUSENTE]');

    // Buscar usuario por email
    const query = 'SELECT id, username, email, password, role, is_active FROM users WHERE email = $1 AND is_active = true';
    console.log('🔍 Ejecutando query:', query);
    console.log('🔍 Con parámetro:', email);
    
    const result = await pool.query(query, [email]);
    console.log('📊 Resultado query - rows encontradas:', result.rows.length);

    if (result.rows.length === 0) {
      console.log('❌ Usuario no encontrado o inactivo');
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const user = result.rows[0];
    console.log('👤 Usuario encontrado:', {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      hasPassword: !!user.password
    });
    console.log('🔍 Hash almacenado:', user.password);

    // Verificar contraseña
    console.log('🔄 Comparando contraseñas...');
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('✅ Resultado comparación:', isValidPassword);

    if (!isValidPassword) {
      console.log('❌ Contraseña incorrecta');
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    console.log('✅ Login exitoso, generando tokens...');

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
    res.json({
      success: true,
      message: 'Login exitoso',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      accessToken,
      refreshToken
    });

    console.log('✅ Respuesta enviada exitosamente');

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

    // Verificar si el usuario ya existe
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'El usuario o email ya existe'
      });
    }

    // Hashear contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar nuevo usuario
    const newUser = await pool.query(
      'INSERT INTO users (username, email, password, role, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id, username, email, role',
      [username, email, hashedPassword, 'user', true]
    );

    const user = newUser.rows[0];

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
        role: user.role
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
// RUTA PARA OBTENER PERFIL
// ===============================================
router.get('/profile', async (req, res) => {
  try {
    // El middleware de auth ya validó el token y agregó user al req
    const userId = req.user.userId;

    const result = await pool.query(
      'SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = $1 AND is_active = true',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      data: {
        user: result.rows[0]
      }
    });

  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ===============================================
// RUTA DE LOGOUT
// ===============================================
router.post('/logout', (req, res) => {
  // En JWT stateless, el logout se maneja en el frontend
  res.json({
    success: true,
    message: 'Logout exitoso'
  });
});

module.exports = router;