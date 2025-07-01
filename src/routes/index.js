let express = require('express');
let router = express.Router();
const app_version = require('../package.json').version;
const tw_util = require('../util/tw.js');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('login', {
    action: '/usuario/autenticar',
    csrf_token: req.csrfToken(),
    title: 'Inicio de Sesión',
    version: app_version,
    wd_color: tw_util.get_color(),
  });
});

module.exports = router;