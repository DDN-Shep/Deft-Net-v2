var express = require('express'),
    router  = express.Router();

router.post('/signup', function(req, res, next) {
	res.send({  });
	res.end();
});

router.post('/signin', function(req, res, next) {
	res.send({  });
	res.end();
});

module.exports = router;
