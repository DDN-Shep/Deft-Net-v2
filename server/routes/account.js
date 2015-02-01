var express = require('express'),
    router  = express.Router();

router.get('/partials/:name', function(req, res, next) {
	if (req.params.name)
		res.render('account/partials/' + req.params.name);
});

router.get('/:name', function(req, res, next) {
	if (req.params.name)
		res.render('account/' + req.params.name);
});

module.exports = router;
