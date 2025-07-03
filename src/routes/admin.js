require('dotenv').config();
const express = require('express');
const router = express.Router();
const app_version = require('../package.json').version;
const db = require('../models/index.js');
const ssr = require('../util/ssr.js');
const tw_util = require('../util/tw.js');
const jwt_util = require('../util/jwt.js');

router.get('/usuarios', jwt_util.auth_verify, jwt_util.verify_admin, async (req, res, next) => {
    let users = await db.User.findAll();

    res.render('admin/users', {
        action: '/usuario/rol',
        isAdmin: jwt_util.is_admin(req),
        csrf_token: req.csrfToken(),
        errors: req.session.errors,
        success: req.session.success,
        title: 'Gestión de roles de usuario',
        users: users,
        version: app_version,
        wd_color: tw_util.get_color()
    });

    ssr.reset_error_messages(req);
    ssr.reset_success_messages(req);
});

module.exports = router;
