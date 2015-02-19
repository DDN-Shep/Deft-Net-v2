var express = require('express'),
    auth    = require('../../auth/authenticate'),
    router  = express.Router();

router.post('/signup', function(req, res, next) {
	res.send({});
	res.end();
});

router.post('/signin', auth.authenticateRequest);

module.exports = router;
