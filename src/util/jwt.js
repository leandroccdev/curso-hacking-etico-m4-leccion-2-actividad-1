require('dotenv').config();
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const db = require('../models/index.js');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRE_IN = process.env.JWT_EXPIRE_IN;
const JWT_ALGORITHM = process.env.JWT_ALGORITHM;

/**
 * Middleware para verificar el token jwt y comprueba la sesión en base de datos.
 */
async function auth_verify(req, res, next) {
    try {
        let token = req.cookies?.token || null;
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
                    [Op.gt]: jwt_util.get_now()
                }
            }
        });

        // Sesión no encontrada
        if (!user_session) {
            // Le indica al browser que elimine la cookie
            res.clearCookie('token', { path: '/' });
            // De vuelta al login
            res.redirect('/usuario/login');
        }

        // Verificación exitosa del token jwt
        return next();
    // Usuario sin token o con token expirado
    } catch (err) {
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

/**
 * Genera un timestamp compatible con el campo exp de jwt para compararciones.
 * 
 * @returns Integer
 */
function get_now() {
    return Math.floor(Date.now() / 1000);
}

module.exports = {
    get_now: get_now,
    users_verify_token: users_verify_token,
    auth_verify: auth_verify,
};