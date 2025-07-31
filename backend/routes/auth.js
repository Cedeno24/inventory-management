// ===============================================
// RUTAS DE AUTENTICACIÓN
// ===============================================

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// ===============================================
// VALIDACIONES
// ===============================================
const registerValidation = [
    body('username')
        .isLength({ min: 3, max: 50 })
        .withMessage('El nombre de usuario debe tener entre 3 y 50 caracteres')
        .matches(/^[a-zA-Z0-9_]+$/)
        .withMessage('El nombre de usuario solo puede contener letras, números y guiones bajos'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Email inválido'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('La contraseña debe tener al menos 6 caracteres')
];

const loginValidation = [
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('Contraseña requerida')
];

// ===============================================
// FUNCIONES AUXILIARES
// ===============================================
const generateTokens = (userId) => {
    const accessToken = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    const refreshToken = jwt.sign(
        { userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
    );

    return { accessToken, refreshToken };
};

const hashPassword = async (password) => {
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    return await bcrypt.hash(password, saltRounds);
};

// ===============================================
// REGISTRAR USUARIO
// ===============================================
router.post('/register', registerValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos',
                errors: errors.array()
            });
        }

        const { username, email, password } = req.body;

        // Verificar si el usuario ya existe
        const existingUser = await query(
            'SELECT id FROM users WHERE username = $1 OR email = $2',
            [username, email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'El usuario o email ya están registrados'
            });
        }

        // Hash de la contraseña
        const hashedPassword = await hashPassword(password);

        // Crear usuario
        const result = await query(
            `INSERT INTO users (username, email, password, role) 
             VALUES ($1, $2, $3, 'user') 
             RETURNING id, username, email, role, created_at`,
            [username, email, hashedPassword]
        );

        const newUser = result.rows[0];

        // Generar tokens
        const { accessToken, refreshToken } = generateTokens(newUser.id);

        console.log(`✅ Usuario registrado: ${username} (${email})`);

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            data: {
                user: {
                    id: newUser.id,
                    username: newUser.username,
                    email: newUser.email,
                    role: newUser.role,
                    createdAt: newUser.created_at
                },
                tokens: {
                    accessToken,
                    refreshToken
                }
            }
        });

    } catch (error) {
        console.error('❌ Error en registro:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===============================================
// INICIAR SESIÓN
// ===============================================
router.post('/login', loginValidation, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Datos inválidos',
                errors: errors.array()
            });
        }

        const { email, password } = req.body;

        // Buscar usuario
        const userResult = await query(
            'SELECT id, username, email, password, role, is_active FROM users WHERE email = $1',
            [email]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        const user = userResult.rows[0];

        // Verificar si la cuenta está activa
        if (!user.is_active) {
            return res.status(401).json({
                success: false,
                message: 'Cuenta desactivada. Contacta al administrador'
            });
        }

        // Verificar contraseña
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        // Generar tokens
        const { accessToken, refreshToken } = generateTokens(user.id);

        console.log(`✅ Usuario logueado: ${user.username} (${user.email})`);

        res.json({
            success: true,
            message: 'Inicio de sesión exitoso',
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                },
                tokens: {
                    accessToken,
                    refreshToken
                }
            }
        });

    } catch (error) {
        console.error('❌ Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===============================================
// OBTENER PERFIL DEL USUARIO
// ===============================================
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        const userResult = await query(
            `SELECT 
                id, username, email, role, is_active, created_at, updated_at,
                (SELECT COUNT(*) FROM products WHERE created_by = $1) as products_created
             FROM users WHERE id = $1`,
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        const user = userResult.rows[0];

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    isActive: user.is_active,
                    productsCreated: parseInt(user.products_created),
                    createdAt: user.created_at,
                    updatedAt: user.updated_at
                }
            }
        });

    } catch (error) {
        console.error('❌ Error obteniendo perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// ===============================================
// VERIFICAR TOKEN (PARA FRONTEND)
// ===============================================
router.get('/verify-token', authenticateToken, (req, res) => {
    res.json({
        success: true,
        message: 'Token válido',
        data: {
            user: {
                id: req.user.id,
                username: req.user.username,
                email: req.user.email,
                role: req.user.role
            }
        }
    });
});

// ===============================================
// CERRAR SESIÓN
// ===============================================
router.post('/logout', authenticateToken, (req, res) => {
    console.log(`✅ Usuario deslogueado: ${req.user.username}`);
    
    res.json({
        success: true,
        message: 'Sesión cerrada exitosamente'
    });
});

module.exports = router;