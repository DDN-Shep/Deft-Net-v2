var express = require('express'),
    router  = express.Router();

router.get('/', function(req, res, next) {
    res.render('shared/layout');
});

router.get('/partials/:name', function(req, res, next) {
	if (req.params.name)
		res.render('home/partials/' + req.params.name);
});

module.exports = router;
