var express = require('express'),
    router  = express.Router();

router.get('/partials/:name', function(req, res, next) {
	if (req.params.name)
		res.render('home/partials/' + req.params.name);
});

router.get('/:name', function(req, res, next) {
	if (req.params.name)
		res.render('home/' + req.params.name);
});

router.get('/', function(req, res, next) {
	res.render('shared/layout');
});

module.exports = router;
