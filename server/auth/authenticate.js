var passport = require('passport'),
		identity = require('./identity'),
    user     = require('../data/modules/user');

(function(auth) {

	auth.authenticateRequest = function(req, res, next) {
		if (req.user) {
			res.send({
				firstname: req.user.firstname,
				lastname: req.user.lastname,
				username: req.user.username
			});
		}
		else {
			var auth = passport.authenticate('local', function(error, user) {
				if (error) return next(error);

				if (user) {
					req.logIn(user, function(error) {
						if (error) return next(error);

						res.send({
							firstname: user.firstname,
							lastname: user.lastname,
							username: user.username
						});
					});
				}
				else res.end();
			});

			auth(req, res, next);
		}
	};

	auth.authenticateUser = function(username, password, next) {
		user.findUser(username, function(error, user) {
			if (!error && user) {
				var hash = identity.hashPassword(password, user.salt);

				if (hash === user.password) {
					next(null, user);
				}
			}
			else next(null, false);
		})
	};

})(module.exports);