require('dotenv').config();
const express = require('express');
const router = express.Router();
const app_version = require('../package.json').version;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const db = require('../models/index.js');
const ssr = require('../util/ssr.js');
const tw_util = require('../util/tw.js');
const jwt_util = require('../util/jwt.js');
const { v4: uuidv4 } = require('uuid');
const escape_html = require('escape-html');

// Al menos 10 iteraciones en la salt de bcrypt
const BCRYPT_SALT_ITERATIONS = parseInt(process.env.SALT_ITERATIONS) || 10;

// Largo de contraseñas
const PASSWORD_MIN_LENGTH = parseInt(process.env.PASSWORD_MIN_LENGTH);

// Clave para jwt
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRE_IN = process.env.JWT_EXPIRE_IN;
const JWT_ALGORITHM = process.env.JWT_ALGORITHM;

// Máxima duración de la sesión
const SESSION_MAX_AGE = parseInt(process.env.SESSION_MAX_AGE);

/**
 * Muestra la vista de registro de usuarios
 */
router.get('/registro', (req, res, next) => {
    res.render('user/register', {
        action: '/usuario',
        isAdmin: jwt_util.is_admin(req),
        csrf_token: req.csrfToken(),
        errors: req.session.errors,
        success: req.session.success,
        title: 'Registro de Usuario',
        version: app_version,
        wd_color: tw_util.get_color()
    });
});

/**
 * Registra un nuevo usuario
 */
router.post('/', async (req, res, next) => {
    ssr.reset_error_messages(req);
    ssr.reset_success_messages(req);

    const { username, password, password2 } = req.body;
    // Campos vacíos
    if (!(username || password || password2)) {
        req.session.errors.push('¡Todos los campos son obligatorios!');
        return res.redirect('/usuario/registro');
    }

    // Valida XSS en nombre de usuario
    if (username !== escape_html(username)) {
        req.session.errors.push('¡Ocurrió un erro al procesar la solicitud!');
        res.redirect('/usuario/registrar');
    }

    // Valida que las contraseñas concuerden
    if (password !== password2) {
        req.session.errors.push('¡Las contraseñas no concuerdan!');
        res.redirect('/usuario/registro');
    }

    // Valida largo de contraseñas
    if (password.length < PASSWORD_MIN_LENGTH || password2.length < PASSWORD_MIN_LENGTH) {
        req.session.erros.push('¡La contraseña debe tener mínimo 8 caracteres!');
        return res.redirect('/usuario/registro');
    }

    // Verifica si el usuario ya existe
    let usernames = await db.User.count({ where: { name: username } });
    if (usernames > 0) {
        req.session.errors.push('¡El nombre de usuario ya existe!');
        return res.redirect('/usuario/registro');
    }

    // Hashear password
    let salt = await bcrypt.genSaltSync(BCRYPT_SALT_ITERATIONS)
    let password_hash = bcrypt.hashSync(password, salt);

    // Crear usuario
    const u = await db.User.create({
        name: username,
        password: password_hash,
        isAdmin: false
    });

    // De vuelta al formulario de registro
    req.session.success.push('¡Usuario registrado!');
    return res.redirect('/usuario/registro');
});

/**
 * Permite al usuario iniciar sesión
 */
router.get('/login', jwt_util.users_verify_token, async (req, res, next) => {
    res.render('user/login', {
        action: '/usuario/autenticar',
        csrf_token: req.csrfToken(),
        errors: req.session.errors,
        success: req.session.success,
        title: 'Inicio de Sesión',
        version: app_version,
        wd_color: tw_util.get_color(),
    });
});

/**
 * Gestiona la autenticación de usuarios
 */
router.post('/autenticar', jwt_util.users_verify_token, async (req, res, next) => {
    ssr.reset_error_messages(req);
    ssr.reset_success_messages(req);

    const { username, password } = req.body;
    let is_login_ok = false;

    is_login_ok = !!username && !!password;

    // Validar existencia de usuario
    if (is_login_ok) {
        const usernames = await db.User.count({ where: { name: username } });
        is_login_ok = usernames > 0;
    }

    // Validar password
    let user = null;
    if (is_login_ok) {
        user = await db.User.findOne({ where: { name: username } });
        is_login_ok = bcrypt.compareSync(password, user.password);
    }

    // Login erróneo
    if (!is_login_ok) {
        req.session.errors.push("¡Usuario y/o contraseña invalidos!");
        return res.redirect('/usuario/login');
    }

    // Generar token jwt
    const sessionId = uuidv4();
    const token = jwt.sign(
        {
            isAdmin: user.isAdmin,
            sessionId: sessionId,
            username: user.name,
        },
        JWT_SECRET,
        {
            algorithm: JWT_ALGORITHM,
            expiresIn: JWT_EXPIRE_IN
        }
    );

    // Decodifica token para leer exp
    let decoded_token = jwt.verify(
        token,
        JWT_SECRET,
        {
            algorithms: [JWT_ALGORITHM]
        }
    );

    // Crear sesion en tabla session
    let s = await db.Session.create({
        userId: user.id,
        sessionId: sessionId,
        token: token,
        active: true,
        expireAt: decoded_token.exp
    });

    // Configura el token en la cookie de respuesta
    res.cookie(
        'token',
        token, {
            maxAge: SESSION_MAX_AGE,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            path: '/'
        }
    );

    // Redirige a /
    return res.redirect('/');
});

/**
 * Cierra la sessión del usuario
 */
router.get('/logout', async (req, res, next) => {
    ssr.reset_error_messages(req);
    ssr.reset_success_messages(req);

    // Procesar el token de session
    let token = req.cookies?.token || null;

    // Token no viene, devuelta al login
    if (!token)
        return res.redirect('/usuario/login');

    try {
        // Decodifica token
        let decoded_token = jwt.verify(
            token,
            JWT_SECRET,
            {
                algorithms: [JWT_ALGORITHM]
            }
        );

        // Busca la sesion por id
        let user_session = await db.Session.findOne({
            where: {
                sessionId: decoded_token.sessionId,
                active: true,
                expireAt: {
                    [Op.gt]: jwt_util.get_now()
                }
            }
        });

        // Desactiva la sessión
        if (user_session) {
            user_session.active = false;
            user_session.save();
        }

        // Le indica al browser que elimine la cookie
        res.clearCookie('token', { path: '/' });

    // Error al decodificar, de vuelta al login
    } catch (err) {
        console.log(err);
    }

    return res.redirect('/usuario/login');
});

/**
 * Gestiona la administración de roles en los usuarios
 * Solo para administradores
 */
router.post('/rol', jwt_util.auth_verify, jwt_util.verify_admin, async (req, res, next) => {
    ssr.reset_error_messages(req);
    ssr.reset_success_messages(req);

    // Procesa campos del tipo user-[id]-rol
    let user_rol_changed = false;
    for (const k of Object.keys(req.body)) {
        if (/user-[0-9]+-rol/.test(k)) {
            const match = k.match(/user-([0-9]+)-rol/);
            // match: [ 'user-1-rol', '1', index: 0, input: 'user-1-rol', groups: undefined ]
            if (match.length > 0) {
                // Verifica que userId exista
                let user = await db.User.findByPk(match[1]);
                // Usuario existe, se modifica el rol del usuario
                if (user) {
                    user.isAdmin = req.body[k] === '1';
                    console.log(req.body[k] === '1');
                    user.save();
                    user_rol_changed = true;
                }
            }
        }
    }

    // Notifica al usuario sobre los cambios guardados
    if (user_rol_changed)
        req.session.success.push('¡Cambios guardados!');

    return res.redirect('/admin/usuarios');
});

module.exports = router;
