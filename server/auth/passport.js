var passport = require('passport'),
    local    = require('passport-local'),
    auth     = require('../auth/authenticate'),
    user     = require('../data/modules/user');

passport.use(new local.Strategy(auth.authenticateUser));

passport.serializeUser(function(user, next) {
	next(null, user.username);
});

passport.deserializeUser(function(key, next) {
	user.findUser(key, function(error, user) {
		if (error) next(error, false, { message: 'Failed to retrieve user' });
		else next(null, user);
	});
});

module.exports = function(app) {
	app.use(passport.initialize());
	app.use(passport.session());
};