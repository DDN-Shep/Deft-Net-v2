var mongoose = require('mongoose');

module.exports = function(config) {
	mongoose.connect(config.db.connection);

	var db = mongoose.connection;

	db.on('error', console.error.bind(console, 'mongodb connection error...'));
	db.once('open', function() {
		console.log('mongodb ' + db.name + ' open...');
	});
};