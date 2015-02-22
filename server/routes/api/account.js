var express = require('express'),
    auth    = require('../../auth/authenticate'),
    router  = express.Router();

router.post('/signout', function(req, res, next) {
	req.logout();
	res.end();
});

router.post('/signin', auth.authenticateRequest);

router.post('/signup', function(req, res, next) {
    // todo
});

module.exports = router;
