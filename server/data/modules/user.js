var schema   = {
	    user: require('../schema/user')
    },
    identity = require('../../auth/identity');

(function(module) {

	module.seedUsers = function(next) {
		schema.user.find().exec(function(error, users) {
			if (error) return console.error(error);

			if (!users || !users.length) module.addUsers([{
				firstname: 'Andrew',
				lastname: 'Sheppard',
				username: 'shep@ddn.com',
				password: 'ddn'
			}], next);
		});
	};

	module.addUsers = function(users, next) {
		for (var i in users) {
            var user = users[i];

			user.salt = identity.createSalt();
			user.password = identity.hashPassword(user.password, user.salt);

			schema.user.create(user);
		}

		next();
	};

	module.getUsers = function(next) {
		var result = null;

		if (!next)
			schema.user.find().exec(function(error, users) {
				if (error) return console.error(error);

				result = users;
			});
		else schema.user.findOne({ _id: id }).exec(next);

		return result;
	};

	module.getUser = function(id, next) {
		var result = null;

		if (!next)
			schema.user.findOne({ _id: id }).exec(function(error, user) {
				if (error) return console.error(error);

				result = user;
			});
		else schema.user.findOne({ _id: id }).exec(next);

		return result;
	};

	module.findUser = function(username, next) {
		var result = null;

		if (!next)
			schema.user.findOne({ username: username }).exec(function(error, user) {
				if (error) return console.error(error);

				result = user;
			});
		else schema.user.findOne({ username: username }).exec(next);

		return result;
	};

})(module.exports);