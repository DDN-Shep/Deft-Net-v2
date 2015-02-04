var express = require('express'),
    router  = express.Router();

router.get('/', function(req, res, next) {
    res.render('portfolio/codepen/index');
});

router.get('/partials/:name', function(req, res, next) {
    if (req.params.name)
        res.render('portfolio/codepen/partials/' + req.params.name);
});

module.exports = router;
