angular.module('ddnApp').factory('identitySvc', function() {
	return {
		currentUser: undefined,
		isAuthenticated: function() {
			return !!this.currentUser;
		}
	};
});