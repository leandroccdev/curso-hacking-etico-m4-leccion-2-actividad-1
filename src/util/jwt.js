require('dotenv').config();
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const db = require('../models/index.js');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRE_IN = process.env.JWT_EXPIRE_IN;
const JWT_ALGORITHM = process.env.JWT_ALGORITHM;

/**
 * Genera un timestamp compatible con el campo exp de jwt para compararciones.
 * 
 * @returns Integer
 */
function get_now() {
    return Math.floor(Date.now() / 1000);
}

/**
 * Lee desde el token de sesión el nombre del usuario activo.
 * @returns string o null cuando no hay token de sesión.
 */
function get_user_name(req) {
    try {
        let token = req.cookies?.token || null;
    
        // No hay token
        if (!token)
            return null;
        // Intenta realizar decodificación
        let decoded_token = jwt.verify(
            token,
            JWT_SECRET,
            {
                algorithms: [JWT_ALGORITHM]
            }
        );
        // Devuelve el username del usuario activo
        return decoded_token.username;
    } catch (err) {
        return null;
    }
}

/**
 * Lee los datos de la sesión e indica si el usuario actual es administrador
 * @returns True si el user es administrador, false si no lo es
 */
function is_admin(req) {
    try {
        let token = req.cookies?.token || null;
    
        // No hay token
        if (!token)
            return false;
        // Intenta realizar decodificación
        let decoded_token = jwt.verify(
            token,
            JWT_SECRET,
            {
                algorithms: [JWT_ALGORITHM]
            }
        );
        // Devuelve el flag isAdmin
        return decoded_token.isAdmin;
    } catch (err) {
        return false;
    }
}

/**
 * Indica si el usuario tiene un token jwt válido con una sesión válida
 * @returns True si el usuario se considera logueado, false de otra manera.
 */
async function is_logged(req) {
     try {
        let token = req.cookies?.token || null;

        // No hay token
        if (!token)
            return false;

        // Intenta realizar decodificación
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
                    [Op.gt]: get_now()
                }
            }
        });

        return !!user_session;
    } catch (err) {
        return false;
    }
}

/**
 * Middleware para verificar el token jwt y comprueba la sesión en base de datos.
 */
async function auth_verify(req, res, next) {
    try {
        let token = req.cookies?.token || null;

        // No hay token
        if (!token)
            return res.redirect('/usuario/login');

        // Intenta realizar decodificación
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
                    [Op.gt]: get_now()
                }
            }
        });

        // Sesión no encontrada
        if (!user_session) {
            // Le indica al browser que elimine la cookie
            res.clearCookie('token', { path: '/' });
            // De vuelta al login
            return res.redirect('/usuario/login');
        }

        // Session correcta, se configura la sesión para el middleware siguiente
        else {
            req.session.user = {
                userId:    user_session.userId,
                sessionId: decoded_token.sessionId,
                name:      decoded_token.name,
                isAdmin:   decoded_token.isAdmin
            };
        }

        // Verificación exitosa del token jwt
        next();
    // Usuario sin token o con token expirado
    } catch (err) {
        console.log(err);
        // Redirigir al login
        return res.redirect('/usuario/login');
    }
}

/**
 * Verifica que el usuario de la sesión sea administrador o devuelve al inicio.
 * Nota: no verifica la autenticación ni busca por sesiones activas.
 */
function verify_admin(req, res, next) {
 try {
        let token = req.cookies?.token || null;

        // No hay token
        if (!token)
            return res.redirect('/usuario/login');

        // Intenta realizar decodificación
        let decoded_token = jwt.verify(
            token,
            JWT_SECRET,
            {
                algorithms: [JWT_ALGORITHM]
            }
        );

        // el usuario no es administrador
        if (!decoded_token.isAdmin)
            return res.redirect('/');

        // el usuario es administrador
        next();

    // Usuario sin token o con token expirado
    } catch (err) {
        console.log(err);
        // Redirigir al login
        return res.redirect('/usuario/login');
    }
}

/**
 * Middleware usado en login y autenticación.
 * Su función es la inversa a verify_token, cuando el usuario tiene el
 * token y éste es valido, se redirige a /, de lo contrario se procede
 * con el middleware siguiente en la pila.
 */
function users_verify_token(req, res, next) {
    try {
        let jwt_token = req.cookies?.token || null;
        // console.log(jwt_token, !jwt_token);

        // No viene el token, se prosigue con el login/autenticación
        if (!jwt_token)
            return next();

        // Intenta realizar decodificación
        let r = jwt.verify(
            jwt_token,
            JWT_SECRET,
            {
                algorithms: [JWT_ALGORITHM]
            }
        );
        // console.log(r);
        // Verificación exitosa del token jwt
        return res.redirect('/');

    // Usuario sin token o con token expirado
    } catch (err) {
        // Se prosigue con el login/autenticación
        return next();
    }
}

module.exports = {
    auth_verify: auth_verify,
    get_now: get_now,
    get_user_name: get_user_name,
    is_admin: is_admin,
    is_logged: is_logged,
    users_verify_token: users_verify_token,
    verify_admin: verify_admin
};