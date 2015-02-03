var mongoose = require('mongoose');

var schema = mongoose.Schema({
	firstname: String,
	lastname: String,
	username: String,
	password: String,
	salt: String
});

module.exports = mongoose.model('user', schema);