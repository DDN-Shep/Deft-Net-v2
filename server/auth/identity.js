(function(identity) {
	identity.createSalt = function() {
		return crypto.randomBytes(128).toString('base64');
	};

	identity.hashPassword = function(password, salt) {
		return password && salt
			? crypto.createHmac('sha1', salt).update(password).digest('hex')
			: null;
	};
})(module.exports);