var express = require('express'),
    router  = express.Router();

/* GET users listing. */
router.get('/', function(req, res, next) {
	res.send([{
		username: 'DDN-Shep',
		firstname: ' Andrew',
		surname: 'Sheppard'
	}]);
});

module.exports = router;
