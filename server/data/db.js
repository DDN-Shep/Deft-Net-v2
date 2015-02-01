var mongoose = require('mongoose');

module.exports = function(config) {
	mongoose.connect(config.db.connection);

	var db = mongoose.connection;

	db.on('error', console.error.bind(console, 'mongodb connection error...'));
	db.once('open', function() {
		console.log('mongodb ' + db.name + ' open...');

		//model.user.find({}).exec(function(error, users)
		//{
		//    if (!users.length)
		//    {
		//        var salt = createSalt(),
		//            hash = hashPassword('pass', salt);
		//
		//        model.user.create({
		//            firstname: 'Andrew',
		//            lastname: 'Sheppard',
		//            username: 'DDN-Shep',
		//            password: hash,
		//            salt: salt
		//        });
		//    }
		//});
	});
};