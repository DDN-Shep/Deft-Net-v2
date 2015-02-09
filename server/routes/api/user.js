var express = require('express'),
    user    = require('../../data/modules/user'),
    router  = express.Router();

/* GET users listing */
router.get('/', function(req, res, next) {
	user.getUsers(function(error, users) {
		if (!error) res.send(users);
		// TODO: error
	});
});

/* GET user */
router.get('/:id', function(req, res, next) {
	user.getUser(req.params.id, function(error, user) {
		if (!error) res.send(user);
		// TODO: error
	});
});

/* POST user */
router.post('/', function(req, res, next) {
	res.send([{
		username: 'DDN-Shep',
		firstname: 'Andrew',
		surname: 'Sheppard'
	}]);
});

/* UPDATE user */
router.put('/:id', function(req, res, next) {
	res.send({  });
	res.end();
});

/* DELETE user */
router.delete('/:id', function(req, res, next) {
	res.send({  });
	res.end();
});

module.exports = router;
