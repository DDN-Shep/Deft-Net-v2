var mongoose = require('mongoose');

var user = mongoose.Schema({
	                           firstname: String,
	                           lastname: String,
	                           username: String,
	                           password: String,
	                           salt: String
                           });

module.exports = user;