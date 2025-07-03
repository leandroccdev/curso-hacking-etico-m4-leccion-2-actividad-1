let express = require('express');
let router = express.Router();
const app_version = require('../package.json').version;
const jwt_util = require('../util/jwt.js');
const tw_util = require('../util/tw.js');
const db = require('../models/index.js');
const ssr = require('../util/ssr.js');
const escape_html = require('escape-html');
const { Op, fn, col } = require('sequelize');

/**
 * Muestra el inicio del blog
 */
router.get('/', jwt_util.auth_verify, async (req, res, next) => {
    let posts = await db.Post.findAll({
        attributes: [
            'id',
            'title',
            'body',
            'userId',
            [fn('DATE_FORMAT', col('Post.createdAt'), '%d-%m-%Y'), 'creationDate'],
            [fn('DATE_FORMAT', col('Post.createdAt'), '%H:%i'), 'creationTime'],
        ],
        include: [
            {
                model: db.User,
                as: 'author',
                attributes: ['name']
            }
        ]
    });
    res.render('blog/index', {
        isAdmin: jwt_util.is_admin(req),
        isLogged: await jwt_util.is_logged(req),
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
router.get('/blog/nuevo', jwt_util.auth_verify, async (req, res, next) => {
    res.render('blog/new', {
        action: '/blog/nuevo',
        isAdmin: jwt_util.is_admin(req),
        isLogged: await jwt_util.is_logged(req),
        csrf_token: req.csrfToken(),
        errors: req.session.errors,
        success: req.session.success,
        title: 'Nueva Entrada',
        version: app_version,
        wd_color: tw_util.get_color()
    });
});

/**
 * Muestra un mensaje del blog
 */
router.get('/blog/:id', jwt_util.auth_verify, async (req, res, next) => {
    // Chequea XSS
    if (escape_html(req.params.id) !== req.params.id)
        return res.redirection('/not-found');

    // Busca post
    const post = await db.Post.findByPk(escape_html(req.params.id), {
        attributes: [
            'id',
            'title',
            'body',
            'userId',
            [fn('DATE_FORMAT', col('Post.createdAt'), '%d-%m-%Y'), 'creationDate'],
            [fn('DATE_FORMAT', col('Post.createdAt'), '%H:%i'), 'creationTime'],
        ],
        include: [
            {
                model: db.User,
                as: 'author',
                attributes: ['name']
            }
        ]
    });

    // no existe
    if (!post)
        return res.redirect('/not-found');

    res.render('blog/message', {
        isAdmin: jwt_util.is_admin(req),
        isLogged: await jwt_util.is_logged(req),
        delete_action: '/blog/eliminar',
        csrf_token: req.csrfToken(),
        errors: req.session.errors,
        isAdmin: jwt_util.is_admin(req),
        post: post,
        success: req.session.success,
        title: post.title,
        version: app_version,
        wd_color: tw_util.get_color()
    });
});

/**
 * Gestiona la edición de un mensaje
 */
router.get('/blog/:id/editar', jwt_util.auth_verify, jwt_util.verify_admin, async (req, res, next) => {
    // Chequea XSS
    if (escape_html(req.params.id) !== req.params.id)
        return res.redirection('/not-found');

    // Busca post
    const post = await db.Post.findByPk(escape_html(req.params.id), {
        attributes: [
            'id',
            'title',
            'body',
            'userId',
            [fn('DATE_FORMAT', col('Post.createdAt'), '%d-%m-%Y'), 'creationDate'],
            [fn('DATE_FORMAT', col('Post.createdAt'), '%H:%i'), 'creationTime'],
        ],
        include: [
            {
                model: db.User,
                as: 'author',
                attributes: ['name']
            }
        ]
    });

    // no existe
    if (!post)
        return res.redirection('/not-found');

    res.render('blog/edit', {
        action: '/blog/editar',
        isAdmin: jwt_util.is_admin(req),
        isLogged: await jwt_util.is_logged(req),
        csrf_token: req.csrfToken(),
        errors: req.session.errors,
        isAdmin: jwt_util.is_admin(req),
        post: post,
        success: req.session.success,
        title: post.title,
        version: app_version,
        wd_color: tw_util.get_color()
    });
});

/**
 * Gestiona la edición de un mensaje.
 * Nota: Solo para administradores con sesión activa.
 */
router.post('/blog/editar', jwt_util.auth_verify, jwt_util.verify_admin, async (req, res, next) => {
    ssr.reset_error_messages(req);
    ssr.reset_success_messages(req);

    let { title, body, postId } = req.body;

    // Detectar XSS en post id
    if (postId !== escape_html(postId)) {
        return res.redirect(`/not-found`);
    }

    // Campos vacíos
    if (!title || !body || !postId) {
        req.session.errors.push('¡Todos los campos son obligatorios!');
        return res.redirect(`/blog/${postId}/editar`);
    }

    // Escapado del html para prevenir xss
    title = escape_html(title);
    body = escape_html(body);

    // Busca el post para realizar la edición
    let post = await db.Post.findByPk(postId);
    // Post no encontrado
    if (!post) {
        return res.redirect(`/not-found`);
    }

    post.title = title;
    post.body = body;
    post.save();

    req.session.success.push('¡Mensaje editado!');
    res.redirect(`/blog/${postId}/editar`);
});

/**
 * Gestiona la eliminación de un mensaje.
 * Nota: Solo para usuarios administradores con sesión activa.
 */
router.post('/blog/eliminar', jwt_util.auth_verify, jwt_util.verify_admin, async (req, res, next) => {
    // Verifica XSS
    if (req.body.post !== escape_html(req.body.post))
        return res.redirect('/not-found');

    // Busca el post
    const post = await db.Post.findByPk(req.body.post);

    // Post no existe
    if (!post)
        return res.redirect('/not-found');

    // Elimina el post
    post.destroy();

    return res.redirect('/');
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