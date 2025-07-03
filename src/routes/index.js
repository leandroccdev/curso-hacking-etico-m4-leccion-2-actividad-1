let express = require('express');
let router = express.Router();
const app_version = require('../package.json').version;
const jwt_util = require('../util/jwt.js');
const tw_util = require('../util/tw.js');
const db = require('../models/index.js');
const ssr = require('../util/ssr.js');
const escape_html = require('escape-html');

/**
 * Muestra el inicio del blog
 */
router.get('/', jwt_util.auth_verify, (req, res, next) => {
    let posts = db.Post.findAll();

    res.render('blog/index', {
        // action: '/blog/post',
        csrf_token: req.csrfToken(),
        errors: req.session.errors,
        posts: posts,
        success: req.session.success,
        title: 'Blog de Leandro',
        version: app_version,
        wd_color: tw_util.get_color()
    });
});

/**
 * Formulario para crear una nueva entrada
 */
router.get('/blog/nuevo', jwt_util.auth_verify, (req, res, next) => {
    res.render('blog/new', {
        action: '/blog/nuevo',
        csrf_token: req.csrfToken(),
        errors: req.session.errors,
        success: req.session.success,
        title: 'Nueva Entrada',
        version: app_version,
        wd_color: tw_util.get_color()
    });
});

/**
 * Crea un nuevo mensaje en el blog
 */
router.post('/blog/nuevo', jwt_util.auth_verify, async (req, res, next) => {
    ssr.reset_error_messages(req);
    ssr.reset_success_messages(req);

    let { title, body } = req.body;

    // Campos vacíos
    if (!title || !body) {
        req.session.errors.push('¡Todos los campos son obligatorios!');
        return res.redirect('/blog/nuevo');
    }

    // Escapado del html para prevenir xss
    title = escape_html(title);
    body = escape_html(body);

    const username = jwt_util.get_user_name(req);
    // Ésto no debería pasar debido a la validación auth_verify
    if (!username) {
        req.session.erros.push('¡Ocurrió un error al procesar la solicitud!');
        return res.redirect('/blog/nuevo');
    }
    console.log(username);
    // Busca el usuario de la sesión activa
    const user = await db.User.findOne({ where: { name: username } });
    // El usuario de la sesión no se encontró
    if (!user) {
        req.session.erros.push('¡Ocurrió un error al procesar la solicitud!');
        return res.redirect('/blog/nuevo');
    }

    // Guarda el mensaje
    db.Post.create({
        title: title,
        body: body,
        userId: user.id
    });

    req.session.success.push('¡Mensaje creado!');
    res.redirect('/blog/nuevo');
});

module.exports = router;