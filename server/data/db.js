var mongoose = require('mongoose'),
    identity = require('../auth/identity');
    user     = require('./schema/user');

module.exports = function(config) {
	mongoose.connect(config.db.connection);

	var db = mongoose.connection;

	db.on('error', console.error.bind(console, 'mongodb connection error...'));
	db.once('open', function() {
		console.log('mongodb ' + db.name + ' open...');

		user.find().exec(function(error, users) {
			if (error) return console.error(error);

			if (!users.length) {
				var salt = identity.createSalt(),
				    hash = identity.hashPassword('pass', salt);

				user.create({
					firstname: 'Andrew',
					lastname: 'Sheppard',
					username: 'DDN-Shep',
					password: hash,
					salt: salt
				});
			}
		});
	});
};