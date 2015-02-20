var express = require('express'),
    auth    = require('../../auth/authenticate'),
    router  = express.Router();

router.post('/signup', function(req, res, next) {
	req.logout();
	res.end();
});

router.post('/signin', auth.authenticateRequest);

module.exports = router;
