require('dotenv').config();
const express = require('express');
const router = express.Router();
const app_version = require('../package.json').version;
const bcrypt = require('bcrypt');
const tw_util = require('../util/tw.js');
const db = require('../models/index.js');
const ssr = require('../util/ssr.js');

// Al menos 10 iteraciones en la salt de bcrypt
const BCRYPT_SALT_ITERATIONS = parseInt(process.env.SALT_ITERATIONS) || 10;

// Largo de contraseñas
const PASSWORD_MIN_LENGTH = parseInt(process.env.PASSWORD_MIN_LENGTH);

/**
 * Muestra la vista de registro de usuarios
 */
router.get('/registro', (req, res, next) => {
  res.render('register', {
    action: '/usuario',
    csrf_token: req.csrfToken(),
    errors: req.session.errors,
    title: 'Registro de Usuario',
    success: req.session.success,
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
 * Gestiona la autenticación de usuarios
 */
router.post('/autenticar', (req, res, next) => {
  const { username, password }  = req.body;
  console.log(username, password);
  res.send("test");
  // next();
});

module.exports = router;
