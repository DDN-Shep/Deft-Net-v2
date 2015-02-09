var identity = require('./identity'),
    user     = require('../data/modules/user');

(function(auth) {

	auth.authenticateUser = function(username, password, next) {
		user.findUser(username, function(error, user) {
			if (!error && user) {
				var hash = identity.hashPassword(password, user.salt);

				if (hash === user.password) {
					next(null, user);
				}
			}
			else next(null, false, { message: 'Invalid crendentials' });
		})
	};

})(module.exports);