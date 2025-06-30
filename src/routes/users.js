let express = require('express');
let router = express.Router();

/**
 * Gestiona la autenticación de usuarios
 */
router.post('/auth', (req, res, next) => {
  const { username, password }  = req.body;
  console.log(username, password);
  res.send("test");
  // next();
});

module.exports = router;
