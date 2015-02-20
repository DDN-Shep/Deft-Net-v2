var express = require('express'),
    router  = express.Router();

router.get('/', function(req, res, next) {
    var injection;

    if (req.user)
    {
        injection = {
            user: {
                username: req.user.username,
                firstname: req.user.firstname,
                lastname: req.user.lastname
            }
        };
    }

    res.render('shared/layout', injection);
});

router.get('/partials/:name', function(req, res, next) {
	if (req.params.name)
		res.render('home/partials/' + req.params.name);
});

module.exports = router;
