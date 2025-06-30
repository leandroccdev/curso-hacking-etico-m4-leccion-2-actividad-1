var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/auth', function(req, res, next) {
  next();
});

module.exports = router;
