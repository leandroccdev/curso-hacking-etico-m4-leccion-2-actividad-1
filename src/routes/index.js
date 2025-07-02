let express = require('express');
let router = express.Router();
const app_version = require('../package.json').version;
const jwt_util = require('../util/jwt.js');
const tw_util = require('../util/tw.js');

/* GET home page. */
router.get('/', jwt_util.auth_verify, function (req, res, next) {
    res.send('index');
});

module.exports = router;